const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../classes/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Regex: lettres, chiffres, point, tiret, underscore — pas d'espaces
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

// Validation robustesse mot de passe
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) errors.push('au moins 8 caractères');
    if (!/[A-Z]/.test(password)) errors.push('une majuscule');
    if (!/[a-z]/.test(password)) errors.push('une minuscule');
    if (!/[0-9]/.test(password)) errors.push('un chiffre');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('un caractère spécial (!@#$%...)');
    return errors;
}

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName, promotion, campus, filiere } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Nom d'utilisateur, email et mot de passe requis" });
        }

        // Validation email @ynov.com
        if (!email.toLowerCase().endsWith('@ynov.com')) {
            return res.status(400).json({ error: "L'adresse email doit être une adresse @ynov.com" });
        }

        // Validation format username
        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({ error: "Le nom d'utilisateur doit contenir entre 3 et 30 caractères (lettres, chiffres, point, tiret, underscore). Pas d'espaces." });
        }

        // Vérification unicité username
        const usernameExists = await User.usernameExists(username);
        if (usernameExists) {
            return res.status(409).json({ error: `Le nom d'utilisateur "${username}" est déjà pris. Essaie "${username}1" ou "${username}_ynov".` });
        }

        // Vérification unicité email
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });
        }

        // Validation robustesse mot de passe
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ error: `Le mot de passe doit contenir : ${passwordErrors.join(', ')}.` });
        }

        const newUser = await User.create({ username, email, password, fullName, promotion, campus, filiere });
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.status(201).json({ user: newUser.toPublicObject(), token });
    } catch (error) {
        console.error('[REGISTER ERROR]', error.code, error.message);
        res.status(500).json({ error: "Erreur serveur lors de l'inscription", detail: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Validation email @ynov.com
        if (!email.toLowerCase().endsWith('@ynov.com')) {
            return res.status(400).json({ error: "Seules les adresses @ynov.com sont autorisées" });
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

// Vérification disponibilité username en temps réel
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        if (!USERNAME_REGEX.test(username)) {
            return res.json({ available: false, message: "Format invalide (lettres, chiffres, point, tiret, underscore)" });
        }
        const exists = await User.usernameExists(username);
        res.json({
            available: !exists,
            message: exists ? `"${username}" est déjà pris` : `"${username}" est disponible`,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
