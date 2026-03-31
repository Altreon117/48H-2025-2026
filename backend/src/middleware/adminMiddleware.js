const jwt = require('jsonwebtoken');
const database = require('../classes/Database');

const adminMiddleware = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authorizationHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;

        const rows = await database.query('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]);
        if (rows.length === 0 || !rows[0].is_admin) {
            return res.status(403).json({ error: 'Accès refusé — droits administrateur requis' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

module.exports = adminMiddleware;
