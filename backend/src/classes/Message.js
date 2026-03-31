const database = require('./Database');

class Message {
    constructor(data) {
        this.id = data.id;
        this.senderId = data.sender_id;
        this.receiverId = data.receiver_id;
        this.content = data.content;
        this.isRead = data.is_read;
        this.createdAt = data.created_at;
        this.senderUsername = data.sender_username;
        this.senderFullName = data.sender_full_name;
        this.receiverUsername = data.receiver_username;
        this.receiverFullName = data.receiver_full_name;
    }

    static async create({ senderId, receiverId, content }) {
        const result = await database.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content]
        );

        const rows = await database.query(
            `SELECT messages.*,
                sender.username AS sender_username, sender.full_name AS sender_full_name,
                receiver.username AS receiver_username, receiver.full_name AS receiver_full_name
            FROM messages
            JOIN users sender ON messages.sender_id = sender.id
            JOIN users receiver ON messages.receiver_id = receiver.id
            WHERE messages.id = ?`,
            [result.insertId]
        );
        return new Message(rows[0]);
    }

    static async findConversation(userId, partnerId) {
        await database.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
            [partnerId, userId]
        );

        const rows = await database.query(
            `SELECT messages.*,
                sender.username AS sender_username, sender.full_name AS sender_full_name,
                receiver.username AS receiver_username, receiver.full_name AS receiver_full_name
            FROM messages
            JOIN users sender ON messages.sender_id = sender.id
            JOIN users receiver ON messages.receiver_id = receiver.id
            WHERE (messages.sender_id = ? AND messages.receiver_id = ?)
                OR (messages.sender_id = ? AND messages.receiver_id = ?)
            ORDER BY messages.created_at ASC`,
            [userId, partnerId, partnerId, userId]
        );
        return rows.map(row => new Message(row));
    }

    static async findConversationList(userId) {
        const rows = await database.query(
            `SELECT DISTINCT
                CASE WHEN messages.sender_id = ? THEN messages.receiver_id ELSE messages.sender_id END AS partner_id,
                partner.username AS partner_username,
                partner.full_name AS partner_full_name,
                partner.promotion AS partner_promotion,
                partner.avatar_url AS partner_avatar_url,
                MAX(messages.created_at) AS last_message_date,
                (SELECT content FROM messages m2
                    WHERE (m2.sender_id = ? AND m2.receiver_id = partner.id)
                       OR (m2.sender_id = partner.id AND m2.receiver_id = ?)
                    ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
                SUM(CASE WHEN messages.sender_id = partner.id AND messages.receiver_id = ? AND messages.is_read = FALSE THEN 1 ELSE 0 END) AS unread_count
            FROM messages
            JOIN users partner ON partner.id = CASE WHEN messages.sender_id = ? THEN messages.receiver_id ELSE messages.sender_id END
            WHERE messages.sender_id = ? OR messages.receiver_id = ?
            GROUP BY partner.id
            ORDER BY last_message_date DESC`,
            [userId, userId, userId, userId, userId, userId, userId]
        );
        return rows;
    }

    static async countUnread(userId) {
        const rows = await database.query(
            'SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );
        return rows[0].count;
    }
}

module.exports = Message;
