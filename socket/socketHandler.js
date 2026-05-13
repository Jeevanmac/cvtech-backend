const socketIo = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production' 
                ? [process.env.FRONTEND_PROD_URL, 'https://chandu-test-web.web.app']
                : [process.env.FRONTEND_URL || 'http://localhost:5173'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Make io globally accessible for controllers
    global.io = io;

    io.on('connection', (socket) => {
        logger.info(`New Client Connected: ${socket.id}`);

        // Automated room joining protocol
        socket.on('join', (data) => {
            if (data?.userId) {
                socket.join(data.userId);
                logger.info(`Socket ${socket.id} joined personal room: ${data.userId}`);
            }
            if (data?.role === 'admin') {
                socket.join('admin');
                logger.info(`Socket ${socket.id} joined administrative room.`);
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client Disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper to notify a specific user
const notifyUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};

// Helper to notify all admins
const notifyAdmins = (event, data) => {
    if (io) {
        // Admin room should be joined by admin users
        io.to('admin').emit(event, data);
    }
};

module.exports = { initSocket, getIo, notifyUser, notifyAdmins };
