const database = require('../classes/Database');

async function generateEmbedding(text) {
    // 💡 On utilise le TOUT NOUVEAU modèle officiel de Google
    const modelName = 'gemini-embedding-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: `models/${modelName}`,
            content: { parts: [{ text }] },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API ${response.status}: ${err}`);
    }

    const data = await response.json();

    // Sécurité : on s'assure que l'API a bien renvoyé les vecteurs
    if (!data.embedding || !data.embedding.values) {
        throw new Error("L'API a répondu mais n'a pas renvoyé les valeurs d'embedding attendues.");
    }

    return data.embedding.values;
}

function cosineSimilarity(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function seedEmbeddings() {
    console.log('[Suggestions] Génération des embeddings...');
    const users = await database.query('SELECT id, bio, filiere FROM users');

    for (const user of users) {
        const bio = user.bio || 'Pas de biographie renseignée.';
        const filiere = user.filiere || 'Non renseignée';
        const text = `Filière: ${filiere}. Biographie: ${bio}`;

        try {
            const vector = await generateEmbedding(text);
            await database.query(
                'UPDATE users SET bio_embedding = ? WHERE id = ?',
                [JSON.stringify(vector), user.id]
            );
        } catch (err) {
            console.error(`[Suggestions] Erreur embedding user ${user.id}:`, err.message);
        }
    }
    console.log(`[Suggestions] ${users.length} embeddings générés.`);
}

async function generateAllSuggestions() {
    console.log('[Suggestions] Calcul des similarités...');

    const users = await database.query(
        'SELECT id, bio_embedding FROM users WHERE bio_embedding IS NOT NULL'
    );

    const parsed = users.map(u => ({
        id: u.id,
        vector: JSON.parse(u.bio_embedding),
    }));

    // On nettoie l'ancienne table pour repartir à zéro avec les nouvelles similarités
    await database.query('DELETE FROM ai_friend_suggestions');

    let count = 0;
    for (const userA of parsed) {
        for (const userB of parsed) {
            if (userA.id === userB.id) continue;

            const score = cosineSimilarity(userA.vector, userB.vector);

            // On ne garde que les suggestions avec une bonne similarité (> 0.75)
            if (score > 0.75) {
                await database.query(
                    `INSERT INTO ai_friend_suggestions (user_id, suggested_user_id, similarity_score)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE similarity_score = VALUES(similarity_score)`,
                    [userA.id, userB.id, score]
                );
                count++;
            }
        }
    }
    console.log(`[Suggestions] ${count} suggestions enregistrées.`);
}

async function runSuggestionPipeline() {
    try {
        await seedEmbeddings();
        await generateAllSuggestions();
        console.log('[Suggestions] ✅ Pipeline terminé.');
    } catch (err) {
        console.error('[Suggestions] ❌ Erreur pipeline:', err.message);
    }
}

module.exports = { runSuggestionPipeline };

// Exécution directe si lancé manuellement : node src/scripts/generateSuggestions.js
if (require.main === module) {
    require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
    runSuggestionPipeline().then(() => process.exit(0));
}