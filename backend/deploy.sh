#!/bin/bash
# =============================================
# 🚀 SCRIPT DE DÉPLOIEMENT YNOVCONNECT (BACKEND)
# À lancer directement sur le VPS
# =============================================

# 🔧 Variables
PROJECT_DIR="/root/ynov/ynov_connect/backend"
APP_NAME="api-ynovconnect"
ENTRY_POINT="src/server.js" # Modifie si ton fichier d'entrée est différent

echo "==============================================="
echo "🚀 Déploiement automatique du Backend API"
echo "==============================================="

# Étape 1️⃣ : Aller dans le dossier du projet
cd "$PROJECT_DIR" || { echo "❌ Dossier projet introuvable au chemin : $PROJECT_DIR"; exit 1; }

# Étape 2️⃣ : Installer les dépendances
echo "📦 Installation / Mise à jour des dépendances..."
npm install --silent

# Étape 3️⃣ : Lancement ou Redémarrage avec PM2
echo "🔄 Gestion de l'API avec PM2..."

# On vérifie si une instance PM2 porte déjà ce nom
pm2 describe "$APP_NAME" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "ℹ️  L'application '$APP_NAME' tourne déjà. Redémarrage en cours..."
  pm2 restart "$APP_NAME"
else
  echo "🚀 Première exécution. Démarrage de '$APP_NAME'..."
  pm2 start "$ENTRY_POINT" --name "$APP_NAME"
fi

# Étape 4️⃣ : Sauvegarde PM2 (pour redémarrer en cas de reboot du serveur)
echo "💾 Sauvegarde de la configuration PM2..."
pm2 save

echo "==============================================="
echo "✅ Déploiement Backend terminé avec succès !"
echo "👀 Pour voir les logs en direct : pm2 logs $APP_NAME"
echo "==============================================="
