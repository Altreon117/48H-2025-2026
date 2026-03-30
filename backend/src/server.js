require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const profileRoutes = require('./routes/profileRoutes');
const messageRoutes = require('./routes/messageRoutes');
const newsRoutes = require('./routes/newsRoutes');

const application = express();
const httpServer = http.createServer(application);

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const PORT = process.env.PORT || 3001;

application.use(cors({ origin: 'http://localhost:5173', credentials: true }));
application.use(express.json());

application.use('/api/auth', authRoutes);
application.use('/api/posts', postRoutes);
application.use('/api', profileRoutes);
application.use('/api/messages', messageRoutes);
application.use('/api/news', newsRoutes);

application.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Socket.io — authentification par token JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token manquant'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch {
        next(new Error('Token invalide'));
    }
});

// Map userId -> socketId pour cibler les utilisateurs
const onlineUsers = new Map();

io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    console.log(`[Socket] Utilisateur ${userId} connecté`);

    // Rejoindre une room personnelle
    socket.join(`user:${userId}`);

    // Message privé en temps réel
    socket.on('send_message', (data) => {
        const { receiverId, message } = data;
        io.to(`user:${receiverId}`).emit('new_message', {
            ...message,
            senderId: userId,
        });
    });

    // Indicateur de frappe
    socket.on('typing_start', (data) => {
        const { receiverId } = data;
        io.to(`user:${receiverId}`).emit('user_typing', { senderId: userId });
    });

    socket.on('typing_stop', (data) => {
        const { receiverId } = data;
        io.to(`user:${receiverId}`).emit('user_stop_typing', { senderId: userId });
    });

    // Nouveau post publié -> broadcast à tous
    socket.on('new_post', (post) => {
        socket.broadcast.emit('feed_new_post', post);
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(userId);
        console.log(`[Socket] Utilisateur ${userId} déconnecté`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`DB: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
});

module.exports = { io };
