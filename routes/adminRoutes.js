const express = require('express');
const router = express.Router();
const { grantAccess, revokeAccess, resetDownloadCount, getAnalytics, getSystemLogs, updateUserRole, getAllUsers, createAdmin, promoteUser, demoteAdmin, getAdminMessages, getOrders, deleteOrder, clearAllOrders, deleteUser, toggleSuspendUser } = require('../controllers/adminController');
const { protect, isAdmin, isSuperuser, isSuperAdmin } = require('../middleware/auth');

router.use(protect, isAdmin);

router.post('/grant-access', grantAccess);
router.post('/revoke-access', revokeAccess);
router.post('/reset-downloads', resetDownloadCount);
router.get('/analytics', getAnalytics);
router.get('/messages', getAdminMessages);
router.get('/logs', getSystemLogs);
router.get('/users', getAllUsers);
router.get('/orders', getOrders);
router.delete('/orders', clearAllOrders);
router.delete('/orders/:id', deleteOrder);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/suspend', toggleSuspendUser);

// SuperUser Exclusive Commands
router.put('/users/:id/role', isSuperuser, updateUserRole);

// Strict Super Admin Boundaries
router.post('/create-admin', isSuperAdmin, createAdmin);
router.patch('/promote/:userId', isSuperAdmin, promoteUser);
router.patch('/demote/:userId', isSuperAdmin, demoteAdmin);

module.exports = router;
