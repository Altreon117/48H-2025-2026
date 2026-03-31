const database = require('./Database');

class News {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.category = data.category;
        this.eventDate = data.event_date;
        this.createdAt = data.created_at;
    }

    static async findAll() {
        const rows = await database.query(
            'SELECT * FROM news ORDER BY event_date ASC, created_at DESC'
        );
        return rows.map(row => new News(row));
    }

    static async findById(newsId) {
        const rows = await database.query('SELECT * FROM news WHERE id = ?', [newsId]);
        if (rows.length === 0) return null;
        return new News(rows[0]);
    }

    static async create({ title, content, category, eventDate }) {
        const result = await database.query(
            'INSERT INTO news (title, content, category, event_date) VALUES (?, ?, ?, ?)',
            [title, content, category, eventDate]
        );
        return await News.findById(result.insertId);
    }
}

module.exports = News;
