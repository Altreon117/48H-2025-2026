import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;

        // Définition de l'URL du socket selon l'environnement
        this.socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD
            ? 'https://api-ynovconnect.skayizen.fr'
            : 'http://localhost:6001'); // Remets 3001 ici si ton backend local tourne sur 3001
    }

    connect(token) {
        if (this.socket?.connected) return this.socket;

        this.socket = io(this.socketUrl, {
            auth: { token },
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connecté');
        });

        this.socket.on('connect_error', (error) => {
            console.warn('[Socket] Erreur de connexion:', error.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(receiverId, message) {
        this.socket?.emit('send_message', { receiverId, message });
    }

    emitTypingStart(receiverId) {
        this.socket?.emit('typing_start', { receiverId });
    }

    emitTypingStop(receiverId) {
        this.socket?.emit('typing_stop', { receiverId });
    }

    emitNewPost(post) {
        this.socket?.emit('new_post', post);
    }

    onNewMessage(callback) {
        this.socket?.on('new_message', callback);
    }

    onUserTyping(callback) {
        this.socket?.on('user_typing', callback);
    }

    onUserStopTyping(callback) {
        this.socket?.on('user_stop_typing', callback);
    }

    onFeedNewPost(callback) {
        this.socket?.on('feed_new_post', callback);
    }

    off(event) {
        this.socket?.off(event);
    }
}

export default new SocketService();