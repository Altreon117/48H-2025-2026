-- Initialisation de la base
CREATE DATABASE IF NOT EXISTS projet_48h;
USE projet_48h;

-- Nettoyage 
SET FOREIGN_KEY_CHECKS = 0; 
DROP TABLE IF EXISTS ai_friend_suggestions;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS private_messages;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Création des tables

-- Table des UTILISATEURS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    sector ENUM('Data/IA', 'Dev', 'Cyber', 'Crea') NOT NULL,
    -- Partie spécifique au Challenge IA  :
    --
    -- is_ai_generated = si la bio a été complétée par IA, 
    -- bio_embedding = création du JSON pour nourrir l'IA qui va suggérer les amis, et gérer l'auto-complétion des bios
    is_ai_generated BOOLEAN DEFAULT FALSE,
    bio_embedding JSON, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table des POSTS (Fil d'actualité)
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des COMMENTAIRES
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) 
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des MESSAGES PRIVÉS
CREATE TABLE private_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des FOLLOWS
CREATE TABLE follows (
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT fk_follower FOREIGN KEY (follower_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_followed FOREIGN KEY (followed_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table des SUGGESTIONS D'AMIS (Résultats de l'IA)
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
) ENGINE=InnoDB;