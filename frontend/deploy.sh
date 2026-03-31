#!/bin/bash
# =============================================
# 🚀 SCRIPT DE DÉPLOIEMENT YNOVCONNECT (FRONTEND)
# À lancer directement sur le VPS
# =============================================

# 🔧 Variables
# ⚠️ À MODIFIER : Mets le chemin exact vers le dossier de ton code source sur le VPS
PROJECT_DIR="/root/ynov/ynov_connect/frontend/"

WEB_DIR="/var/www/ynovconnect.skayizen.fr"
BACKUP_DIR="/var/backups/ynovconnect.skayizen.fr"
DOMAIN="ynovconnect.skayizen.fr"

echo "==============================================="
echo "🚀 Déploiement automatique de ${DOMAIN}"
echo "==============================================="

# Vérifier que le dossier web existe
if [ ! -d "$WEB_DIR" ]; then
  echo "📁 Création du dossier web..."
  mkdir -p "$WEB_DIR"
  chown -R www-data:www-data "$WEB_DIR"
fi

# Étape 1️⃣ : Aller dans le dossier du projet
cd "$PROJECT_DIR" || { echo "❌ Dossier projet introuvable au chemin : $PROJECT_DIR"; exit 1; }

# Étape 2️⃣ : Installer les dépendances
echo "📦 Vérification des dépendances..."
npm install --silent --legacy-peer-deps

# Étape 3️⃣ : Build du projet
echo "🛠️  Compilation du projet..."
npm run build || { echo "❌ Erreur lors du build."; exit 1; }

# Étape 4️⃣ : Sauvegarde
echo "🗄️  Sauvegarde de la version actuelle..."
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
mkdir -p "$BACKUP_DIR"

if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR)" ]; then
  mkdir -p "$BACKUP_DIR/$DATE"
  cp -r "$WEB_DIR"/* "$BACKUP_DIR/$DATE"/
  echo "✅ Sauvegarde effectuée dans : $BACKUP_DIR/$DATE"
else
  echo "ℹ️  Aucun ancien fichier à sauvegarder."
fi

# Étape 5️⃣ : Nettoyage ancienne version
echo "🧹 Suppression de l'ancienne version..."
rm -rf "${WEB_DIR:?}"/*

# Étape 6️⃣ : Déploiement nouvelle version
echo "📁 Déploiement de la nouvelle version..."
# ⚠️ NOTE : Si tu utilises Vite, le dossier généré est "dist". 
# Si tu utilises Create React App, c'est souvent "build". Change "dist/*" en "build/*" si nécessaire.
cp -r dist/* "$WEB_DIR"/ || { echo "❌ Erreur lors de la copie des fichiers de build."; exit 1; }

# Étape 7️⃣ : Permissions
echo "🔒 Mise à jour des permissions..."
chown -R www-data:www-data "$WEB_DIR"

# Étape 8️⃣ : Test Nginx
echo "🔍 Vérification configuration Nginx..."
nginx -t
if [ $? -ne 0 ]; then
  echo "❌ Erreur configuration Nginx. Annulation."
  exit 1
fi

# Étape 9️⃣ : Reload Nginx
echo "🔁 Rechargement Nginx..."
systemctl reload nginx && echo "✅ Nginx rechargé."

echo "==============================================="
echo "✅ Déploiement terminé avec succès !"
echo "🌍 Site disponible sur : https://${DOMAIN}"
if [ -d "$BACKUP_DIR/$DATE" ]; then
    echo "💾 Sauvegarde : ${BACKUP_DIR}/${DATE}"
fi
echo "==============================================="
