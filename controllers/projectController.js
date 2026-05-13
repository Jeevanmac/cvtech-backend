const Project = require('../models/Project');
const User = require('../models/User');
const { generateUploadUrl } = require('../utils/s3');
const generateSignedUrl = require('../utils/generateSignedUrl');
const { createNotification } = require('./notificationController');

/**
 * @desc    Generate an AWS S3 Pre-signed URL for direct ZIP upload
 * @route   GET /api/projects/upload-url?fileName=example.zip
 * @access  Private/Admin
 */
const getPresignedUploadUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.query;
        if (!fileName) return res.status(400).json({ success: false, message: 'File name is required' });

        let contentType = 'application/zip';
        let folder = 'projects';

        if (fileType && fileType.startsWith('image/')) {
            contentType = fileType;
            folder = 'images';
        } else if (fileType && fileType.startsWith('video/')) {
            contentType = fileType;
            folder = 'videos';
        }

        const { signedUrl, key } = await generateUploadUrl(fileName, contentType, folder);
        
        console.log(`[S3] Generated upload URL for: ${key}`);

        res.status(200).json({
            success: true,
            uploadUrl: signedUrl,
            key: key
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error generating upload URL' });
    }
};

/**
 * @desc    Admin saves a new project after securely uploading the ZIP file to S3
 * @route   POST /api/projects
 * @access  Private/Admin
 */
const createProject = async (req, res) => {
    try {
        const { 
            title, description, price, category, techStack, difficulty, 
            imageKeys, zipFileKey, documentationUrl, pptUrl, demoVideoUrl,
            tags, featured, status, deploymentStatus, externalLinks
        } = req.body;

        if (!title || !description || !price || !category || !techStack || !zipFileKey) {
            return res.status(400).json({ success: false, message: 'Provide all required standard fields and the secure ZIP file key.' });
        }

        const project = await Project.create({
            title, description, price, category, techStack, difficulty, 
            imageKeys, zipFileKey, documentationUrl, pptUrl, demoVideoUrl,
            tags, featured, status, deploymentStatus, externalLinks
        });

        // Trigger Notifications
        await createNotification({
            recipientRole: 'user',
            type: 'system',
            title: 'New Project Deployment',
            message: `New asset "${title}" is now available in the vault.`,
            link: `/projects/${project._id}`
        });

        await createNotification({
            recipientRole: 'admin',
            type: 'system',
            title: 'Asset Registered',
            message: `"${title}" has been successfully indexed in the project vault.`,
            link: `/admin/projects`
        });

        console.log(`[DB] Project created: ${project._id} with ${imageKeys?.length || 0} images`);
        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error during project creation' });
    }
};

/**
 * @desc    Update an existing project
 * @route   PUT /api/projects/:id
 * @access  Private/Admin
 */
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByIdAndUpdate(id, req.body, { new: true });

        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Trigger Notification
        await createNotification({
            recipientRole: 'admin',
            type: 'system',
            title: 'Asset Updated',
            message: `Project "${project.title}" has been successfully synchronized.`,
            link: `/admin/projects`
        });

        res.status(200).json({ success: true, project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Update sequence failure' });
    }
};

/**
 * @desc    Permanently delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByIdAndDelete(id);

        if (!project) return res.status(404).json({ success: false, message: 'Project already purged' });

        // Trigger Notification
        await createNotification({
            recipientRole: 'admin',
            type: 'system',
            title: 'Asset Purged',
            message: `Project "${project.title}" has been permanently removed from the vault.`,
            link: `/admin/projects`
        });

        res.status(200).json({ success: true, message: 'Project purged successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Purge sequence failure' });
    }
};

/**
 * @desc    Fetch all active projects for the public marketplace
 * @route   GET /api/projects
 * @access  Public
 */
const getAllProjects = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                    { techStack: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // We ensure we DONT expose the S3 ZIP structural keys in public aggregations
        const rawProjects = await Project.find(query).select('-zipFileKey');
        
        // Generate signed URLs for all images dynamically
        const projects = await Promise.all(rawProjects.map(async (project) => {
            const projectObj = project.toObject();
            if (projectObj.imageKeys && projectObj.imageKeys.length > 0) {
                projectObj.imageUrls = await Promise.all(
                    projectObj.imageKeys.map(key => generateSignedUrl(key))
                );
            } else {
                projectObj.imageUrls = [];
            }
            return projectObj;
        }));

        console.log(`[API] Fetched ${projects.length} projects with signed URLs`);
        res.status(200).json({ success: true, projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error fetching directory' });
    }
};

/**
 * @desc    Fetch specific details about a single project
 * @route   GET /api/projects/:id
 * @access  Public
 */
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).select('-zipFileKey');
        if (!project) return res.status(404).json({ success: false, message: 'Project context missing' });
        
        const projectObj = project.toObject();
        if (projectObj.imageKeys && projectObj.imageKeys.length > 0) {
            projectObj.imageUrls = await Promise.all(
                projectObj.imageKeys.map(key => generateSignedUrl(key))
            );
        } else {
            projectObj.imageUrls = [];
        }

        res.status(200).json({ success: true, project: projectObj });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error retrieving project model' });
    }
};


/**
 * @desc    Get recommended projects for a user based on overlap
 * @route   GET /api/projects/hub/recommendations
 * @access  Private
 */
const getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart').populate('wishlist');
        if (!user) return res.status(404).json({ success: false, message: 'User mapping lost' });

        // Build tech stack overlap based on wishlist and cart
        const interestedTech = new Set();
        user.wishlist.forEach(p => p.techStack.forEach(t => interestedTech.add(t)));
        user.cart.forEach(p => p.techStack.forEach(t => interestedTech.add(t)));

        let query = {};
        if (interestedTech.size > 0) {
            query.techStack = { $in: Array.from(interestedTech) };
        }

        let recommendationsRaw = await Project.find(query)
                                     .select('-zipFileKey')
                                     .sort({ purchaseCount: -1 })
                                     .limit(5);

        // Fallback: If no matches, return most purchased globally
        if (recommendationsRaw.length === 0) {
            recommendationsRaw = await Project.find({})
                                     .select('-zipFileKey')
                                     .sort({ purchaseCount: -1 })
                                     .limit(5);
        }

        // Generate signed URLs for all images
        const recommendations = await Promise.all(recommendationsRaw.map(async (project) => {
            const projectObj = project.toObject();
            if (projectObj.imageKeys && projectObj.imageKeys.length > 0) {
                projectObj.imageUrls = await Promise.all(
                    projectObj.imageKeys.map(key => generateSignedUrl(key))
                );
            } else {
                projectObj.imageUrls = [];
            }
            return projectObj;
        }));

        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Recommendation engine structural error' });
    }
};

module.exports = {
    getPresignedUploadUrl,
    createProject,
    getAllProjects,
    getProjectById,
    getRecommendations,
    updateProject,
    deleteProject
};
