# Guide de Déploiement sur Render (Gratuit)

## Étape 1 : Pousser le code sur GitHub

1. Va sur [github.com](https://github.com) et crée un nouveau repository (appelé par exemple "crm-leads-management")
2. **NE COCHE PAS** "Initialize with README"
3. Copie l'URL du repository (ex: https://github.com/tonusername/crm-leads-management.git)

4. Dans ton terminal, exécute :
```bash
cd /Users/elinoreparienti/Documents/crm-leads-management
git add .
git commit -m "Initial commit - CRM Leads Management"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/crm-leads-management.git
git push -u origin main
```

## Étape 2 : Déployer la Base de Données PostgreSQL

1. Va sur [render.com](https://render.com) et connecte-toi avec GitHub
2. Clique sur **"New +"** → **"PostgreSQL"**
3. Configure :
   - **Name** : `crm-db`
   - **Region** : Frankfurt (le plus proche)
   - **Plan** : **Free**
4. Clique sur **"Create Database"**
5. ⚠️ **IMPORTANT** : Copie l'URL **"Internal Database URL"** (commence par `postgresql://`)

## Étape 3 : Déployer le Backend

1. Clique sur **"New +"** → **"Web Service"**
2. Connecte ton repository GitHub
3. Configure :
   - **Name** : `crm-backend`
   - **Region** : Frankfurt
   - **Branch** : main
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command** : `npm start`
   - **Plan** : **Free**

4. Dans **"Environment Variables"**, ajoute :
   - `DATABASE_URL` = (colle l'URL de la base de données)
   - `JWT_SECRET` = `ton-secret-super-securise-123456`
   - `PORT` = `5001`
   - `NODE_ENV` = `production`

5. Clique sur **"Create Web Service"**

6. ⚠️ **Copie l'URL du backend** (ex: https://crm-backend.onrender.com)

## Étape 4 : Déployer le Frontend

1. **D'ABORD**, modifie le fichier frontend pour utiliser l'URL du backend en production

Dans le dossier frontend, crée un fichier `.env.production` :
```
REACT_APP_API_URL=https://crm-backend.onrender.com
```

Ensuite, modifie tous les appels API dans le frontend pour utiliser cette variable.

2. Retourne sur Render, clique sur **"New +"** → **"Static Site"**
3. Connecte ton repository GitHub
4. Configure :
   - **Name** : `crm-frontend`
   - **Branch** : main
   - **Root Directory** : `frontend`
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `build`

5. Clique sur **"Create Static Site"**

## Étape 5 : Créer l'utilisateur admin

Une fois le backend déployé, tu dois créer l'utilisateur admin.

Tu peux le faire via l'interface Render :
1. Va sur ton backend service
2. Clique sur **"Shell"** (en haut à droite)
3. Exécute :
```bash
node scripts/createAdmin.js
```

## Accès à l'application

Ton CRM sera accessible via l'URL du frontend : `https://crm-frontend.onrender.com`

Login admin :
- Email : DavidParienti.eco@gmail.com
- Mot de passe : David2208!

## ⚠️ Notes importantes

- **Free tier** : Le backend s'endort après 15 minutes d'inactivité (il met ~30 secondes à se réveiller)
- **Base de données** : Expire après 90 jours sur le plan gratuit (il faudra créer une nouvelle DB)
- **Pas de carte bancaire requise** pour le plan gratuit

## En cas de problème

Vérifie les logs dans Render :
- Clique sur ton service → **"Logs"**
