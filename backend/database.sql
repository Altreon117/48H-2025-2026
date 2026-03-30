CREATE DATABASE IF NOT EXISTS ynov_social;
USE ynov_social;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    promotion VARCHAR(10),
    campus VARCHAR(50),
    filiere VARCHAR(100),
    bio TEXT,
    skills TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN bio_embedding JSON;

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('challenge', 'bds', 'bde', 'general') DEFAULT 'general',
    event_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO news (title, content, category, event_date) VALUES
('Challenge 48h - Edition 2025-2026', 'Le grand challenge de developpement de 48h est lance ! Les promotions B1 et B2 s''affrontent pour creer le meilleur reseau social du campus.', 'challenge', '2026-03-31'),
('Tournoi de football BDS', 'Le Bureau Des Sports organise un tournoi inter-promos. Inscriptions ouvertes jusqu''au 5 avril.', 'bds', '2026-04-10'),
('Soiree d''integration BDE', 'Le Bureau Des Etudiants vous invite a la soiree d''integration du semestre. Au programme : blind test, DJ set et buffet.', 'bde', '2026-04-15'),
('Conference IA & Metiers du Numerique', 'Des professionnels du secteur tech viennent presenter leurs parcours et les opportunites d''alternance.', 'general', '2026-04-08');

CREATE TABLE ai_friend_suggestions (
    user_id INT NOT NULL,
    suggested_user_id INT NOT NULL,
    similarity_score FLOAT, 
    suggested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, suggested_user_id),
    CONSTRAINT fk_suggest_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_suggested_target FOREIGN KEY (suggested_user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);