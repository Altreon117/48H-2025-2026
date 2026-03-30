const express = require('express');
const User = require('../classes/User');
const Post = require('../classes/Post');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la recuperation des utilisateurs' });
    }
});

router.get('/users/:username', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByUsername(req.params.username);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
        const posts = await Post.findByUserId(user.id, req.userId);
        res.json({ user: user.toPublicObject(), posts });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la recuperation du profil' });
    }
});

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { fullName, bio, skills, promotion, campus, filiere } = req.body;
        const updatedUser = await User.update(req.userId, { fullName, bio, skills, promotion, campus, filiere });
        res.json({ user: updatedUser.toPublicObject() });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise a jour du profil' });
    }
});

module.exports = router;
