const express = require('express');
const Message = require('../classes/Message');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await Message.findConversationList(req.userId);
        res.json({ conversations });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
    }
});

router.get('/conversation/:partnerId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.findConversation(req.userId, req.params.partnerId);
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
    }
});

router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Destinataire et contenu requis' });
        }

        if (Number(receiverId) === req.userId) {
            return res.status(400).json({ error: 'Impossible de s\'envoyer un message à soi-même' });
        }

        const newMessage = await Message.create({ senderId: req.userId, receiverId, content: content.trim() });
        res.status(201).json({ message: newMessage });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Message.countUnread(req.userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Erreur' });
    }
});

module.exports = router;
