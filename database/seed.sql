-- Exemple de données pour nourrir les tables créées

USE projet_48h;

-- Insertion de quelques utilisateurs de test
INSERT INTO users (username, email, password_hash, bio, sector, is_ai_generated) VALUES 
('RaphInfo', 'raph@ynov.com', 'hash_secure_123', 'Je suis chef de projet', 'Data/IA', FALSE),
('AliceDev', 'alice@ynov.com', 'hash_secure_456', 'Fan de React et de caféine.', 'Dev', FALSE),
('IA_Bot', 'bot@ynov.com', 'hash_secure_789', 'Je suis une IA générée pour vous aider.', 'Data/IA', TRUE);

-- Insertion de quelques posts
INSERT INTO posts (user_id, content) VALUES 
(1, 'On vient de créer un nouveau réseau social ! :)'),
(2, 'Quelqu un s y connait en API Gemini pour le chatbot ?');

-- Insertion de quelques relations (Raph suit Alice)
INSERT INTO follows (follower_id, followed_id) VALUES (1, 2);