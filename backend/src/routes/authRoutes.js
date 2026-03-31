const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../classes/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 💡 On récupère bien toutes les variables optionnelles du front
        const fullName = req.body.fullName || null;
        const promotion = req.body.promotion || null;
        const campus = req.body.campus || null;
        const filiere = req.body.filiere || null;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Nom d'utilisateur, email et mot de passe requis" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        // 💡 On envoie toutes les variables, y compris campus et filiere, à notre classe User
        const newUser = await User.create({ username, email, password, fullName, promotion, campus, filiere });

        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.status(201).json({ user: newUser.toPublicObject(), token });
    } catch (error) {
        console.error('[REGISTER ERROR]', error.code, error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
        }
        res.status(500).json({ error: "Erreur serveur lors de l'inscription", detail: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const userRow = await User.findByEmail(email);
        if (!userRow) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const isPasswordValid = await User.verifyPassword(password, userRow.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = new User(userRow);
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.json({ user: user.toPublicObject(), token });
    } catch (error) {
        console.error('[LOGIN ERROR]', error.code, error.message);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion', detail: error.message });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
        res.json({ user: user.toPublicObject() });
    } catch (error) {
        console.error('[ME ERROR]', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;