const express = require('express');
const News = require('../classes/News');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const newsList = await News.findAll();
        res.json({ news: newsList });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des news' });
    }
});

module.exports = router;
