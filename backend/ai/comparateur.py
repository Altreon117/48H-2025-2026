# Simulation de différents embeddings pour la suggestion d'amis.

import mysql.connector
import json
import os
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import google.generativeai as genai

# Récupération des identifiants de la bdd (données locales dans le fichier .env pour des raisons de sécurité)
load_dotenv()
db_host = os.getenv('DB_HOST')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')
db_name = os.getenv('DB_NAME')

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

try:
    db = mysql.connector.connect(
        host=db_host,
        user=db_user,
        password=db_pass,
        database=db_name
    )
    print("Connexion réussie à la bdd.")
except mysql.connector.Error as err:
    print(f"Erreur : {err}")
cursor = db.cursor()

# Fonction pour générer les embeddings avec Gemini (recupération de la filière + bio)
def seed_real_embeddings():
    cursor.execute("SELECT id, bio, filiere FROM users")
    users = cursor.fetchall()

    for (user_id, bio, filiere) in users:
        clean_bio = bio if bio else "Pas de biographie renseignée."
        text_to_embed = f"Filière: {filiere}. Biographie: {clean_bio}"
        
        print(f"Génération de l'embedding (id {user_id})...")

        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text_to_embed,
                task_type="clustering"
            )
            
            embedding_vector = result['embedding']
            sql = "UPDATE users SET bio_embedding = %s WHERE id = %s"
            cursor.execute(sql, (json.dumps(embedding_vector), user_id))
            
        except Exception as e:
            print(f"Erreur API Gemini pour le user {user_id}: {e}")
    
    db.commit()
    print(f"Bdd mise à jour avec les embeddings pour {len(users)} utilisateurs.")

def compare_users(user_a_id, user_b_id):
    # Récupération des deux JSON qui contiennent les embeddings
    cursor.execute("SELECT bio_embedding FROM users WHERE id = %s", (user_a_id,))
    res_a = cursor.fetchone()
    cursor.execute("SELECT bio_embedding FROM users WHERE id = %s", (user_b_id,))
    res_b = cursor.fetchone()

    if not res_a or not res_b or res_a[0] is None or res_b[0] is None:
        return 0

    user_a_json = res_a[0]
    user_b_json = res_b[0]

    vector_a = json.loads(user_a_json) 
    vector_b = json.loads(user_b_json)

    array_a = np.array(vector_a).reshape(1, -1)
    array_b = np.array(vector_b).reshape(1, -1)
    score = cosine_similarity(array_a, array_b)[0][0]

    return score 

# Renvoie un nombre entre -1 et 1 qui permettra de determiner les utilisateurs similaires

# Récupère tous les utilisateurs de la bdd pour lancer les comparaisons de JSON (fonction du dessus) en boucle
def generate_all_suggestions():
    cursor.execute("SELECT id FROM users")
    all_users = cursor.fetchall()
    user_ids = [u[0] for u in all_users]
    cursor.execute("DELETE FROM ai_friend_suggestions")

    for user_id in user_ids:
        print(f"Calcul des suggestions pour l'utilisateur {user_id}...")
        for potential_friend_id in user_ids:
            if user_id == potential_friend_id:
                continue
        
            score = compare_users(user_id, potential_friend_id)

            # Score pour match : >0.75
            if score > 0.75:
                sql = """
                INSERT INTO ai_friend_suggestions (user_id, suggested_user_id, similarity_score)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE similarity_score = VALUES(similarity_score)
                """
                cursor.execute(sql, (user_id, potential_friend_id, float(score)))
    
    db.commit()
    print("Les suggestions ont bien été enregistrées dans la bdd.")

if __name__ == "__main__":
    seed_real_embeddings()
    generate_all_suggestions()
    cursor.close()
    db.close()