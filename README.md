# YnovConnect - Challenge 48h 2025-2026

Lien démo non complète : https://ynovconnect.skayizen.fr

Plateforme web type reseau social campus avec:
- authentification (utilisateur + admin)
- fil de posts
- messagerie temps reel (Socket.IO)
- actualites campus
- suggestions IA
- espace offres d'emploi

Le projet est separe en deux applications:
- backend Node.js/Express + MySQL
- frontend React/Vite

## Stack technique

- Backend: Node.js, Express, MySQL2, JWT, Socket.IO
- Frontend: React, React Router, Vite, Socket.IO Client
- Base de donnees: MySQL

## Prerequis

- Node.js 18+
- npm
- MySQL 8+ (ou compatible)

## Structure du projet

```text
.
|-- backend/
|   |-- database.sql
|   |-- package.json
|   `-- src/
`-- frontend/
	|-- package.json
	`-- src/
```

## Installation

Depuis la racine du projet, installer les dependances backend et frontend:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Configuration de la base de donnees

1. Creer la base et les tables avec le script SQL:

```sql
-- depuis MySQL
SOURCE backend/database.sql;
```

Le script cree la base `ynov_social` et les tables principales (`users`, `posts`, `messages`, `news`, etc.).

2. Creer le fichier `.env` dans le dossier `backend/`.

Exemple minimal:

```env
PORT=6001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ton_mot_de_passe
DB_NAME=ynov_social
JWT_SECRET=change_me_super_secret
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
```

Notes:
- `PORT=6000` est force automatiquement en `6001` par le serveur.
- `GEMINI_API_KEY` est optionnel pour lancer l'app, mais necessaire pour la pipeline de suggestions IA.

## Lancer le projet en local

### 1. Lancer le backend

```bash
cd backend
npm run dev
```

API attendue sur: `http://localhost:6001`

Healthcheck: `http://localhost:6001/api/health`

### 2. Lancer le frontend

```bash
cd frontend
npm run dev
```

App attendue sur: `http://localhost:5173`

## Variables frontend (optionnel)

Le frontend fonctionne sans fichier `.env` en local, mais vous pouvez surcharger:

```env
VITE_API_BASE=http://localhost:6001
VITE_SOCKET_URL=http://localhost:6001
VITE_BYPASS_AUTH=false
```

## Scripts npm

Backend (`backend/package.json`):
- `npm run dev`: demarrage avec nodemon
- `npm start`: demarrage Node standard

Frontend (`frontend/package.json`):
- `npm run dev`: serveur de dev Vite
- `npm run build`: build de production
- `npm run preview`: previsualisation du build

## Troubleshooting rapide

### Erreur DB: "Impossible de se connecter a MySQL"

Verifier:
- que MySQL tourne
- les variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dans `backend/.env`
- que la base `ynov_social` existe (via `backend/database.sql`)

### Le frontend s'ouvre mais rien ne charge

Verifier:
- que le backend tourne sur `http://localhost:6001`
- le healthcheck `GET /api/health`
- les variables `VITE_API_BASE` et `VITE_SOCKET_URL` si vous les utilisez

### Erreurs CORS

En local, `localhost` est accepte automatiquement. Si besoin, verifier `FRONTEND_URL` dans `backend/.env`.

## Deploiement

Des scripts de deploiement sont presents:
- `backend/deploy.sh`
- `frontend/deploy.sh`

Adapter leur usage a votre environnement (CI/CD, serveur cible, droits SSH, etc.).
