const database = require('./Database');

class Post {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.content = data.content;
        this.category = data.category;
        this.createdAt = data.created_at;
        this.authorUsername = data.username;
        this.authorFullName = data.full_name;
        this.authorPromotion = data.promotion;
        this.authorAvatarUrl = data.avatar_url;
        this.likesCount = data.likes_count || 0;
        this.isLikedByCurrentUser = data.is_liked || false;
    }

    static async create({ userId, content, category = 'general' }) {
        const result = await database.query(
            'INSERT INTO posts (user_id, content, category) VALUES (?, ?, ?)',
            [userId, content, category]
        );
        return await Post.findById(result.insertId, userId);
    }

    static async findById(postId, currentUserId = null) {
        const rows = await database.query(
            `SELECT posts.*, users.username, users.full_name, users.promotion, users.avatar_url,
                COUNT(DISTINCT post_likes.id) AS likes_count,
                MAX(CASE WHEN post_likes.user_id = ? THEN 1 ELSE 0 END) AS is_liked
            FROM posts
            JOIN users ON posts.user_id = users.id
            LEFT JOIN post_likes ON posts.id = post_likes.post_id
            WHERE posts.id = ?
            GROUP BY posts.id`,
            [currentUserId, postId]
        );
        if (rows.length === 0) return null;
        return new Post(rows[0]);
    }

    static async findAll(currentUserId = null) {
        const rows = await database.query(
            `SELECT posts.*, users.username, users.full_name, users.promotion, users.avatar_url,
                COUNT(DISTINCT post_likes.id) AS likes_count,
                MAX(CASE WHEN post_likes.user_id = ? THEN 1 ELSE 0 END) AS is_liked
            FROM posts
            JOIN users ON posts.user_id = users.id
            LEFT JOIN post_likes ON posts.id = post_likes.post_id
            GROUP BY posts.id
            ORDER BY posts.created_at DESC`,
            [currentUserId]
        );
        return rows.map(row => new Post(row));
    }

    static async findByUserId(userId, currentUserId = null) {
        const rows = await database.query(
            `SELECT posts.*, users.username, users.full_name, users.promotion, users.avatar_url,
                COUNT(DISTINCT post_likes.id) AS likes_count,
                MAX(CASE WHEN post_likes.user_id = ? THEN 1 ELSE 0 END) AS is_liked
            FROM posts
            JOIN users ON posts.user_id = users.id
            LEFT JOIN post_likes ON posts.id = post_likes.post_id
            WHERE posts.user_id = ?
            GROUP BY posts.id
            ORDER BY posts.created_at DESC`,
            [currentUserId, userId]
        );
        return rows.map(row => new Post(row));
    }

    static async delete(postId, userId) {
        const result = await database.query(
            'DELETE FROM posts WHERE id = ? AND user_id = ?',
            [postId, userId]
        );
        return result.affectedRows > 0;
    }

    static async toggleLike(postId, userId) {
        const existing = await database.query(
            'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existing.length > 0) {
            await database.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
            return { liked: false };
        } else {
            await database.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
            return { liked: true };
        }
    }
}

module.exports = Post;
