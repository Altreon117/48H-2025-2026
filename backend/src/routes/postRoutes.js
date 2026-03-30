const express = require('express');
const Post = require('../classes/Post');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const posts = await Post.findAll(req.userId);
        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des posts' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { content, category } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Le contenu du post est requis' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Le post ne peut pas dépasser 1000 caractères' });
        }

        const newPost = await Post.create({ userId: req.userId, content: content.trim(), category });
        res.status(201).json({ post: newPost });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du post' });
    }
});

router.delete('/:postId', authMiddleware, async (req, res) => {
    try {
        const deleted = await Post.delete(req.params.postId, req.userId);
        if (!deleted) return res.status(403).json({ error: 'Post introuvable ou non autorisé' });
        res.json({ message: 'Post supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression du post' });
    }
});

router.post('/:postId/like', authMiddleware, async (req, res) => {
    try {
        const result = await Post.toggleLike(req.params.postId, req.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du like' });
    }
});

module.exports = router;
