const bcrypt = require('bcryptjs');
const database = require('./Database');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.fullName = data.full_name;
        this.promotion = data.promotion;
        this.campus = data.campus;
        this.filiere = data.filiere;
        this.bio = data.bio;
        this.skills = data.skills;
        this.avatarUrl = data.avatar_url;
        this.createdAt = data.created_at;
        this.isAdmin = data.is_admin === 1 || data.is_admin === true;
    }

    toPublicObject() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            fullName: this.fullName,
            promotion: this.promotion,
            campus: this.campus,
            filiere: this.filiere,
            bio: this.bio,
            skills: this.skills,
            avatarUrl: this.avatarUrl,
            createdAt: this.createdAt,
            isAdmin: this.isAdmin,
        };
    }

    static async create({ username, email, password, fullName, promotion, campus, filiere }) {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await database.query(
            'INSERT INTO users (username, email, password_hash, full_name, promotion, campus, filiere) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, fullName, promotion, campus, filiere]
        );

        return await User.findById(result.insertId);
    }

    static async findById(userId) {
        const rows = await database.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    static async findByEmail(email) {
        const rows = await database.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    static async findByUsername(username) {
        const rows = await database.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return null;
        return new User(rows[0]);
    }

    static async usernameExists(username) {
        const rows = await database.query('SELECT id FROM users WHERE username = ?', [username]);
        return rows.length > 0;
    }

    static async findAll() {
        const rows = await database.query(
            'SELECT id, username, full_name, promotion, campus, filiere, avatar_url FROM users ORDER BY created_at DESC'
        );
        return rows;
    }

    static async update(userId, { fullName, bio, skills, promotion, campus, filiere }) {
        await database.query(
            'UPDATE users SET full_name = ?, bio = ?, skills = ?, promotion = ?, campus = ?, filiere = ? WHERE id = ?',
            [fullName, bio, skills, promotion, campus, filiere, userId]
        );
        return await User.findById(userId);
    }

    static async verifyPassword(plainPassword, passwordHash) {
        return await bcrypt.compare(plainPassword, passwordHash);
    }
}

module.exports = User;
