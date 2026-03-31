const express = require('express');
const database = require('../classes/Database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/suggestions', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const suggestions = await database.query(
            `SELECT
                s.similarity_score,
                u.id,
                u.username,
                u.full_name,
                u.filiere,
                u.campus,
                u.promotion,
                u.bio,
                u.avatar_url
             FROM ai_friend_suggestions s
             JOIN users u ON u.id = s.suggested_user_id
             WHERE s.user_id = ?
             ORDER BY s.similarity_score DESC
             LIMIT 5`,
            [userId]
        );

        const result = suggestions.map(u => ({
            id:              u.id,
            username:        u.username,
            fullName:        u.full_name,
            filiere:         u.filiere,
            campus:          u.campus,
            promotion:       u.promotion,
            bio:             u.bio,
            avatarUrl:       u.avatar_url,
            similarityScore: Math.round(u.similarity_score * 100),
        }));

        res.json({ suggestions: result });
    } catch (error) {
        console.error('[SUGGESTIONS ERROR]', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
