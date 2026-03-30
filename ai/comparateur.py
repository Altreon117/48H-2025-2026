# Simulation de différents embeddings pour la suggestion d'amis.

import mysql.connector
import json
import random
import os
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Récupération des identifiants de la bdd (données locales dans le fichier .env pour des raisons de sécurité)
load_dotenv()
db_host = os.getenv('DB_HOST')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')
db_name = os.getenv('DB_NAME')

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

def seed_fake_embeddings():
    # Récupération des utilisateurs sans embeddings (pour le test)
    cursor.execute("SELECT id FROM users")
    ids = cursor.fetchall()

    for (user_id,) in ids:
        # Création d'une liste de nombres aléatoires (simulation d'un embedding)
        fake_vector = [random.uniform(-1, 1) for _ in range(1536)]
        
        sql = "UPDATE users SET bio_embedding = %s WHERE id = %s"
        cursor.execute(sql, (json.dumps(fake_vector), user_id))
    
    db.commit()
    print(f"Bdd simulée pour {len(ids)} utilisateurs.")

def compare_users(user_a_id, user_b_id):
    # Récupération des deux JSON qui contiennent les embeddings
    cursor.execute("SELECT bio_embedding FROM users WHERE id = %s", (user_a_id,))
    res_a = cursor.fetchone()
    cursor.execute("SELECT bio_embedding FROM users WHERE id = %s", (user_b_id,))
    res_b = cursor.fetchone()

    if not res_a or not res_b:
        return 0

    user_a_json = res_a[0]
    user_b_json = res_b[0]

    vector_a = json.loads(user_a_json) 
    vector_b = json.loads(user_b_json)

    # Transformation des données en tableaux numpy pour le calcul de similarité
    array_a = np.array(vector_a).reshape(1, -1)
    array_b = np.array(vector_b).reshape(1, -1)
    score = cosine_similarity(array_a, array_b)[0][0]

    return score 

# Renvoie un nombre entre -1 et 1 qui permettra de determiner les utilisateurs similaires

def generate_all_suggestions():
    # Récupère tous les utilisateurs de la bdd pour lancer les comparaisons de JSON (fonction du dessus) en boucle
    cursor.execute("SELECT id FROM users")
    all_users = cursor.fetchall()
    user_ids = [u[0] for u in all_users]

    for user_id in user_ids:
        print(f"Calcul des suggestions pour l'utilisateur {user_id}...")
        for potential_friend_id in user_ids:
            # On ne se suggère pas soi-même
            if user_id == potential_friend_id:
                continue
        
            score = compare_users(user_id, potential_friend_id)

            # Quand le score de similarité est supérieur à 0.75, on l'enregistre
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
    # Testeur avec générateur de faux embeddings json
    seed_fake_embeddings()
    
    # Comparateur des utilisateurs en boucle et enregistrement des suggestions dans la bdd
    generate_all_suggestions()
    
    cursor.close()
    db.close()