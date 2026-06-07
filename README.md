# Plateforme de Billetterie Événementielle - Groupe 9

**Membres du groupe :**
- ONIANDJI Jude
- BOUALA NUKAFO Kingsy Jones
- MAKAYA Taliane

**Projet du module Bases de données NoSQL - Master I - Année Académique 2025-2026**

---

## 📋 Description du projet

Une plateforme de vente de billets pour concerts et événements à Libreville. Les utilisateurs réservent des places ; le paiement doit être confirmé sous dix minutes, sinon la réservation expire et les places sont relibérées.

**Focus NoSQL :** Index TTL et expiration automatique. Exploitation d'un index TTL pour faire expirer automatiquement les réservations non payées, et discussion du rôle de Redis pour les sessions.

---

## 🗄️ Collections principales

- **evenements** : Informations sur les concerts et événements
- **reservations** : Réservations des utilisateurs (avec TTL)
- **utilisateurs** : Informations sur les utilisateurs
- **billets** : Billets générés après paiement

---

## 🚀 Installation et configuration

### Prérequis

- Node.js (v20 ou supérieur)
- MongoDB (local ou Atlas)
- npm ou yarn

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/votre-groupe/billetterie-nosql.git
cd billetterie-nosql
```

2. **Installer les dépendances**
```bash
cd backend
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` dans le dossier `backend` avec le contenu suivant :
```env
PORT=5000
MONGO_URI=mongodb+srv://votre_user:votre_password@cluster.mongodb.net/billetterie?retryWrites=true&w=majority
```

**Pour MongoDB Atlas :**
1. Créer un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster M0 (gratuit)
3. Créer un utilisateur de base de données
4. Whitelister l'IP `0.0.0.0/0` (pour le développement)
5. Copier la chaîne de connexion et remplacer `<password>` par le mot de passe de l'utilisateur

4. **Peupler la base de données avec des données de test**
```bash
node seed.js
```

Cette commande insère :
- 35 utilisateurs avec des noms gabonais
- 30 événements
- 35 réservations
- Des billets pour les réservations confirmées

5. **Créer les index**
```bash
node scripts/createIndexes.js
```

Cette commande crée les index suivants :
- Index composé sur `date` et `lieu` (Evenement)
- Index sur `prix` (Evenement)
- Index text sur `titre` et `description` (Evenement)
- Index sur `email` (Utilisateur)
- Index TTL sur `date_creation` (Reservation)

6. **Lancer le serveur**
```bash
npm start
```

Ou en mode développement avec auto-reload :
```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:5000`

---

## 📡 API Endpoints

### Événements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/evenements` | Lister tous les événements (avec filtres et pagination) |
| POST | `/api/evenements` | Créer un nouvel événement |
| PUT | `/api/evenements/:id` | Mettre à jour un événement |
| DELETE | `/api/evenements/:id` | Supprimer un événement |
| GET | `/api/evenements/stats/recettes` | Agréger les recettes par événement |

### Réservations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/reservations` | Créer une réservation (avec gestion de concurrence) |
| POST | `/api/reservations/:id/payer` | Confirmer le paiement et générer les billets |

### Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/utilisateurs/test` | Récupérer un utilisateur au hasard (pour tests) |

---

## 🔍 Filtres et pagination

### Filtres disponibles pour `/api/evenements`

- `?lieu=Libreville` : Filtrer par lieu (regex insensible à la casse)
- `?prix_max=15000` : Filtrer par prix maximum
- `?prix_min=5000` : Filtrer par prix minimum
- `?recherche=concert` : Recherche textuelle dans titre et description
- `?page=2` : Numéro de page (pagination)
- `?limit=5` : Nombre de résultats par page

**Exemple :**
```
GET /api/evenements?lieu=Libreville&prix_max=15000&page=1&limit=10
```

---

## 🧪 Tester l'API

### Avec Postman

1. Importer la collection `postman_collection.json` dans Postman
2. Exécuter les requêtes pré-configurées

### Avec le frontend

Ouvrir `http://localhost:5000` dans un navigateur pour accéder à l'interface de test.

---

## 📊 Scripts d'analyse

### Analyse des performances des index

**Avant création des index :**
```bash
node scripts/explainAnalysis.js
```

**Après création des index :**
```bash
node scripts/explainAfterIndexes.js
```

Ces scripts montrent :
- Le type de scan (COLLSCAN vs IXSCAN)
- Le nombre de documents examinés
- Le temps d'exécution
- L'index utilisé

---

## 🏗️ Architecture technique

### Stack technique

- **Backend** : Node.js, Express
- **Base de données** : MongoDB (Mongoose)
- **Frontend** : HTML, CSS, JavaScript (vanilla)

### Focus NoSQL - Index TTL

Le projet utilise un index TTL (Time-To-Live) sur la collection `reservations` pour supprimer automatiquement les réservations non payées après 10 minutes :

```javascript
reservationSchema.index(
  { date_creation: 1 },
  {
    expireAfterSeconds: 600,
    partialFilterExpression: { statut: "EN_ATTENTE" }
  }
);
```

Un worker (`ttlWorker.js`) surveille les expirations et réincrémente automatiquement les places disponibles.

### Gestion de la concurrence

Pour garantir qu'on ne vende jamais plus de places que la capacité, le système utilise une mise à jour atomique avec condition :

```javascript
await Evenement.updateOne(
  { 
    _id: evenement_id, 
    places_disponibles: { $gte: nombre_places } // Condition stricte
  },
  { 
    $inc: { places_disponibles: -nombre_places } // Décrémentation atomique
  }
);
```

---

## 📝 Livrables

### Socle obligatoire

- ✅ Dossier de conception avec modèle de données
- ✅ Base de données peuplée (30-50 documents par collection)
- ✅ Opérations CRUD complètes
- ✅ Requêtes avancées et agrégation
- ✅ Indexation et performance (3 index minimum)
- ✅ Captures explain() avant/après
- ✅ Rapport écrit (10-15 pages)
- ✅ Dépôt Git avec README
- ✅ Présentation orale

### Livrables spécifiques Groupe 9

- ✅ Index TTL sur les réservations (expiration 10 minutes)
- ✅ Décrément/réincrément automatique des places
- ✅ Agrégation des recettes par événement
- ✅ Endpoint refusant la vente au-delà de la capacité

### Bonus

- ✅ API REST Node.js (+2 points)
- ✅ Collection Postman documentée (+1 point)
- ⏳ Déploiement VPS (+2 points)

---

## 📈 Index créés

### Collection `evenements`

1. **Index composé** `{ date: 1, lieu: 1 }`
   - Justification : Optimise les recherches par date et lieu combinées

2. **Index sur prix** `{ prix: 1 }`
   - Justification : Optimise les filtres par fourchette de prix

3. **Index text** `{ titre: "text", description: "text" }`
   - Justification : Permet la recherche plein texte sémantique

### Collection `utilisateurs`

4. **Index sur email** `{ email: 1 }`
   - Justification : Optimise l'authentification par email

### Collection `reservations`

5. **Index TTL** `{ date_creation: 1 }` avec `expireAfterSeconds: 600`
   - Justification : Supprime automatiquement les réservations non payées après 10 minutes

---

## 🎓 Comparaison SQL vs NoSQL

### Avantages de MongoDB pour ce projet

1. **Schéma flexible** : Les événements peuvent avoir des attributs variables (artistes, types de billets, etc.)
2. **Index TTL natif** : Expiration automatique des documents sans cron externe
3. **Mises à jour atomiques** : Gestion de la concurrence sans transactions complexes
4. **Agrégation puissante** : Pipeline d'agrégation pour les statistiques de recettes
5. **Scalabilité horizontale** : Facile à scaler avec sharding si le volume augmente

### Limites par rapport au relationnel

1. **Pas de jointures natives** : Utilisation de $lookup qui est moins performant que les JOIN SQL
2. **Transactions limitées** : Les transactions multi-documents existent mais sont plus complexes
3. **Schéma dynamique** : Risque d'incohérence si mal géré

---

## 📚 Documentation

- **Dossier de conception** : `docs/conception.md`
- **Rapport écrit** : `docs/rapport.pdf`
- **Présentation** : `docs/presentation.pdf`

---

## 🤝 Contribution

Ce projet est réalisé dans le cadre du module Bases de données NoSQL de l'Université Omar Bongo.

**Commits par membre :**
- ONIANDJI Jude : Modèles, indexation, seed
- BOUALA NUKAFO Kingsy Jones : API REST, contrôleurs
- MAKAYA Taliane : Frontend, tests, documentation

---

## 📄 Licence

Ce projet est réalisé à des fins pédagogiques dans le cadre d'un projet universitaire.

---

## 📞 Contact

Pour toute question concernant ce projet, contacter les membres du groupe.
