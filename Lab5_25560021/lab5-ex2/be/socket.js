const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const PRODUCTS_ROOM = 'products';
const ADMINS_ROOM = 'admins';

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*' }
    });

    // Xác thực JWT khi client kết nối: io(url, { auth: { token } })
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth && socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication failed'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userType = decoded.type;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        socket.join(`user:${socket.userId}`);
        if (socket.userType === 'admin') {
            socket.join(ADMINS_ROOM);
        }

        console.log(`User ${socket.userId} (${socket.userType}) connected (socket ${socket.id})`);

        socket.on('products:join', () => socket.join(PRODUCTS_ROOM));
        socket.on('products:leave', () => socket.leave(PRODUCTS_ROOM));

        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected (socket ${socket.id})`);
        });
    });

    return io;
}

module.exports = { initSocket, PRODUCTS_ROOM, ADMINS_ROOM };