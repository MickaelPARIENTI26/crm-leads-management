# Configuration Complète du CRM Leads Management

## Résumé des Actions Effectuées

### 1. Base de Données PostgreSQL
- Base de données créée : `crm_leads`
- Utilisateur PostgreSQL : `elinoreparienti`
- Port : `5432`

### 2. Configuration Prisma
- Versions mises à jour :
  - `@prisma/client`: 6.5.0
  - `prisma`: 6.5.0
- Client Prisma généré avec succès
- Migrations exécutées : Tables `User` et `Lead` créées
- Seed exécuté : Utilisateur admin créé

### 3. Corrections Apportées au Code

#### Backend
1. **authController.js** : Correction de l'import Prisma
   - Avant : `require('../prisma/schema')`
   - Après : `require('@prisma/client')`

2. **authMiddleware.js** : Correction de l'import Prisma
   - Avant : `require('../prisma/schema')`
   - Après : `require('@prisma/client')`

3. **leadController.js** : Ajout des fonctions manquantes
   - `importLeads` : Import de leads depuis Excel
   - `getAllLeads` : Récupération de tous les leads (avec relations)
   - `getMyLeads` : Récupération des leads d'un télépro

4. **validation.js** : Ajout du middleware `validateLogin`
   - Utilisation d'express-validator pour la validation

5. **roleMiddleware.js** : Correction pour accepter plusieurs rôles
   - Utilisation de `...allowedRoles` pour flexibilité

6. **userRoutes.js** : Correction des imports
   - Séparation des imports authMiddleware et roleMiddleware

### 4. Configuration Finale

#### Fichier .env
```env
DATABASE_URL="postgresql://elinoreparienti@localhost:5432/crm_leads?schema=public"
JWT_SECRET="crm_secret_jwt_2026_ultra_securise"
PORT=5001
BCRYPT_SALT_ROUNDS=10
EXCEL_UPLOAD_PATH=uploads/excel_files
```

Note : Le port a été changé de 5000 à 5001 car le port 5000 était déjà utilisé par un autre processus.

## Identifiants Admin

**Email :** DavidParienti.eco@gmail.com
**Mot de passe :** David2208!

## Démarrage de l'Application

### Backend

1. Naviguer vers le dossier backend :
```bash
cd backend
```

2. Installer les dépendances (si ce n'est pas déjà fait) :
```bash
npm install
```

3. Démarrer le serveur :
```bash
npm run dev
```

Le serveur sera accessible sur : http://localhost:5001

### Frontend

1. Naviguer vers le dossier frontend :
```bash
cd frontend
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer l'application React :
```bash
npm start
```

L'application sera accessible sur : http://localhost:3000

**IMPORTANT :** Vous devrez peut-être mettre à jour l'URL de l'API dans le frontend pour utiliser le port 5001 au lieu de 5000.

## API Endpoints Disponibles

### Authentification
- `POST /api/auth/login` : Connexion (retourne un token JWT)

### Utilisateurs (ADMIN uniquement)
- `POST /api/users` : Créer un nouveau télépro
- `GET /api/users` : Obtenir tous les utilisateurs

### Leads
- `POST /api/leads/import` : Importer des leads depuis Excel (ADMIN)
- `GET /api/leads` : Obtenir tous les leads (avec filtres)
- `GET /api/leads/my` : Obtenir mes leads (TELEPRO)
- `PUT /api/leads/:id` : Mettre à jour un lead
- `POST /api/leads/assign` : Assigner des leads (ADMIN)

## Structure de la Base de Données

### Table User
- `id` : UUID (Primary Key)
- `email` : String (Unique)
- `password` : String (Hashé avec bcrypt)
- `role` : Enum (ADMIN | TELEPRO)
- `createdAt` : DateTime

### Table Lead
- `id` : UUID (Primary Key)
- `dateLead` : DateTime
- `systemeChauffage` : String
- `prenom` : String
- `nom` : String
- `email` : String
- `telephone` : String
- `informationsSupplementaires` : String (Optional)
- `status` : Enum (NRP | A_RAPPELER | RDV_PRIS | ANNULE)
- `commentaire` : String (Optional)
- `assignedToId` : UUID (Foreign Key → User.id, Optional)
- `createdAt` : DateTime

## Test de l'API

Test de connexion :
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"DavidParienti.eco@gmail.com\",\"password\":\"David2208!\"}"
```

Résultat attendu :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "8a03dc9d-6eff-4308-889f-e50b4ad4b253",
    "email": "DavidParienti.eco@gmail.com",
    "role": "ADMIN"
  }
}
```

## Prochaines Étapes

1. Mettre à jour l'URL de l'API dans le frontend (service/api.js) pour utiliser le port 5001
2. Tester toutes les fonctionnalités :
   - Connexion admin
   - Création de télépros
   - Import de leads depuis Excel
   - Assignation de leads
   - Modification de leads par les télépros
3. Optionnel : Configurer un reverse proxy (nginx) pour unifier les ports

## Notes Importantes

- La base de données est configurée et prête à l'emploi
- Tous les modèles Prisma sont synchronisés
- Le serveur backend fonctionne correctement
- L'authentification JWT est opérationnelle
- Les middlewares de sécurité sont en place

Pour toute question ou problème, référez-vous aux logs du serveur ou aux fichiers de configuration.
