const database = require('./Database');

class Comment {
    constructor(data) {
        this.id = data.id;
        this.postId = data.post_id;
        this.userId = data.user_id;
        this.content = data.content;
        this.createdAt = data.created_at;
        this.authorUsername = data.username;
        this.authorFullName = data.full_name;
        this.authorPromotion = data.promotion;
    }

    static async findByPostId(postId) {
        const rows = await database.query(
            `SELECT post_comments.*, users.username, users.full_name, users.promotion
             FROM post_comments
             JOIN users ON post_comments.user_id = users.id
             WHERE post_comments.post_id = ?
             ORDER BY post_comments.created_at ASC`,
            [postId]
        );
        return rows.map(row => new Comment(row));
    }

    static async create({ postId, userId, content }) {
        const result = await database.query(
            'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );
        const rows = await database.query(
            `SELECT post_comments.*, users.username, users.full_name, users.promotion
             FROM post_comments
             JOIN users ON post_comments.user_id = users.id
             WHERE post_comments.id = ?`,
            [result.insertId]
        );
        return new Comment(rows[0]);
    }

    static async delete(commentId, userId) {
        const result = await database.query(
            'DELETE FROM post_comments WHERE id = ? AND user_id = ?',
            [commentId, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Comment;
