const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../classes/Database');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Toutes les routes admin sont protégées
router.use(adminMiddleware);

/* ============================================================
   DASHBOARD — statistiques globales
   ============================================================ */
router.get('/dashboard', async (req, res) => {
    try {
        const [usersCount] = await database.query('SELECT COUNT(*) AS count FROM users');
        const [postsCount] = await database.query('SELECT COUNT(*) AS count FROM posts');
        const [messagesCount] = await database.query('SELECT COUNT(*) AS count FROM messages');
        const [newsCount] = await database.query('SELECT COUNT(*) AS count FROM news');
        const [likesCount] = await database.query('SELECT COUNT(*) AS count FROM post_likes');

        const recentUsers = await database.query(
            'SELECT id, username, full_name, email, campus, promotion, filiere, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        );
        const recentPosts = await database.query(
            `SELECT posts.id, posts.content, posts.created_at, users.username, users.full_name
             FROM posts JOIN users ON posts.user_id = users.id
             ORDER BY posts.created_at DESC LIMIT 5`
        );

        res.json({
            stats: {
                // 💡 CORRECTION ICI : On utilise directement .count
                users: usersCount?.count || 0,
                posts: postsCount?.count || 0,
                messages: messagesCount?.count || 0,
                news: newsCount?.count || 0,
                likes: likesCount?.count || 0,
            },
            recentUsers,
            recentPosts,
        });
    } catch (error) {
        console.error('[ADMIN DASHBOARD]', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/* ============================================================
   USERS — CRUD complet
   ============================================================ */
router.get('/users', async (req, res) => {
    try {
        const { search, campus, promotion, filiere, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (username LIKE ? OR full_name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (campus) { whereClause += ' AND campus = ?'; params.push(campus); }
        if (promotion) { whereClause += ' AND promotion = ?'; params.push(promotion); }
        if (filiere) { whereClause += ' AND filiere = ?'; params.push(filiere); }

        const [totalRow] = await database.query(
            `SELECT COUNT(*) AS count FROM users ${whereClause}`, params
        );

        const users = await database.query(
            `SELECT id, username, full_name, email, campus, promotion, filiere, bio, skills, is_admin, created_at
             FROM users ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({ users, total: totalRow.count, page: Number(page), limit: Number(limit) });
    } catch (error) {
        console.error('[ADMIN USERS GET]', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const rows = await database.query(
            'SELECT id, username, full_name, email, campus, promotion, filiere, bio, skills, is_admin, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
        res.json({ user: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { fullName, email, campus, promotion, filiere, bio, skills, isAdmin, newPassword } = req.body;
        const userId = req.params.id;

        // Empêcher de se retirer ses propres droits admin
        if (Number(userId) === req.userId && isAdmin === false) {
            return res.status(400).json({ error: "Vous ne pouvez pas retirer vos propres droits admin" });
        }

        let query = 'UPDATE users SET full_name = ?, email = ?, campus = ?, promotion = ?, filiere = ?, bio = ?, skills = ?, is_admin = ?';
        const params = [fullName, email, campus, promotion, filiere, bio, skills, isAdmin ? 1 : 0];

        if (newPassword && newPassword.length >= 8) {
            const passwordHash = await bcrypt.hash(newPassword, 12);
            query += ', password_hash = ?';
            params.push(passwordHash);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await database.query(query, params);

        const updated = await database.query(
            'SELECT id, username, full_name, email, campus, promotion, filiere, bio, skills, is_admin, created_at FROM users WHERE id = ?',
            [userId]
        );
        res.json({ user: updated[0] });
    } catch (error) {
        console.error('[ADMIN USER PUT]', error.message);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email déjà utilisé' });
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        if (Number(req.params.id) === req.userId) {
            return res.status(400).json({ error: 'Impossible de supprimer votre propre compte admin' });
        }
        await database.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/* ============================================================
   POSTS — CRUD complet
   ============================================================ */
router.get('/posts', async (req, res) => {
    try {
        const { search, username, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND posts.content LIKE ?';
            params.push(`%${search}%`);
        }
        if (username) {
            whereClause += ' AND users.username LIKE ?';
            params.push(`%${username}%`);
        }

        const [totalRow] = await database.query(
            `SELECT COUNT(*) AS count FROM posts JOIN users ON posts.user_id = users.id ${whereClause}`, params
        );

        const posts = await database.query(
            `SELECT posts.id, posts.content, posts.category, posts.created_at,
                    users.id AS user_id, users.username, users.full_name,
                    COUNT(DISTINCT post_likes.id) AS likes_count,
                    (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) AS comments_count
             FROM posts
             JOIN users ON posts.user_id = users.id
             LEFT JOIN post_likes ON posts.id = post_likes.post_id
             ${whereClause}
             GROUP BY posts.id
             ORDER BY posts.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({ posts, total: totalRow.count, page: Number(page), limit: Number(limit) });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.put('/posts/:id', async (req, res) => {
    try {
        const { content, category } = req.body;
        await database.query('UPDATE posts SET content = ?, category = ? WHERE id = ?', [content, category, req.params.id]);
        const updated = await database.query(
            `SELECT posts.*, users.username, users.full_name FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?`,
            [req.params.id]
        );
        res.json({ post: updated[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/posts/:id', async (req, res) => {
    try {
        await database.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Post supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/posts/:id/comments', async (req, res) => {
    try {
        const comments = await database.query(
            `SELECT post_comments.id, post_comments.content, post_comments.created_at,
                    users.username, users.full_name
             FROM post_comments
             JOIN users ON post_comments.user_id = users.id
             WHERE post_comments.post_id = ?
             ORDER BY post_comments.created_at ASC`,
            [req.params.id]
        );
        res.json({ comments });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/posts/:id/comments/:commentId', async (req, res) => {
    try {
        await database.query('DELETE FROM post_comments WHERE id = ? AND post_id = ?', [req.params.commentId, req.params.id]);
        res.json({ message: 'Commentaire supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/* ============================================================
   NEWS — CRUD complet
   ============================================================ */
router.get('/news', async (req, res) => {
    try {
        const news = await database.query('SELECT * FROM news ORDER BY created_at DESC');
        res.json({ news });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/news', async (req, res) => {
    try {
        const { title, content, category, eventDate } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });

        const result = await database.query(
            'INSERT INTO news (title, content, category, event_date) VALUES (?, ?, ?, ?)',
            [title, content, category || 'general', eventDate || null]
        );
        const created = await database.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
        res.status(201).json({ news: created[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.put('/news/:id', async (req, res) => {
    try {
        const { title, content, category, eventDate } = req.body;
        await database.query(
            'UPDATE news SET title = ?, content = ?, category = ?, event_date = ? WHERE id = ?',
            [title, content, category, eventDate || null, req.params.id]
        );
        const updated = await database.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
        res.json({ news: updated[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/news/:id', async (req, res) => {
    try {
        await database.query('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ message: 'News supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/* ============================================================
   MESSAGES — lecture + suppression
   ============================================================ */
router.get('/messages', async (req, res) => {
    try {
        const { search, page = 1, limit = 30 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND messages.content LIKE ?';
            params.push(`%${search}%`);
        }

        const [totalRow] = await database.query(
            `SELECT COUNT(*) AS count FROM messages ${whereClause}`, params
        );

        const messages = await database.query(
            `SELECT messages.id, messages.content, messages.is_read, messages.created_at,
                    sender.username AS sender_username, sender.full_name AS sender_full_name,
                    receiver.username AS receiver_username, receiver.full_name AS receiver_full_name
             FROM messages
             JOIN users sender ON messages.sender_id = sender.id
             JOIN users receiver ON messages.receiver_id = receiver.id
             ${whereClause}
             ORDER BY messages.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({ messages, total: totalRow.count });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/messages/:id', async (req, res) => {
    try {
        await database.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
        res.json({ message: 'Message supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;