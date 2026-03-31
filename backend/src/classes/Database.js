const mysql = require('mysql2/promise');

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ynov_social',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        this.pool.getConnection()
            .then(connection => {
                console.log('[DB] Connexion MySQL etablie avec succes');
                connection.release();
            })
            .catch(error => {
                console.error('[DB ERROR] Impossible de se connecter a MySQL:', error.message);
                console.error('[DB ERROR] Verifie les variables dans backend/.env');
            });

        Database.instance = this;
    }

    async query(sql, params = []) {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    async getConnection() {
        return await this.pool.getConnection();
    }
}

module.exports = new Database();
