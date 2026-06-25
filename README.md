<div align="center">

#  Projet NoSQL - Plateforme de Billetterie Événementielle

### Groupe 9 : ONIANDJI Jude • BOUALA NUKAFO Kingsy Jones • MINDZELI Aenold

**Master I - Bases de données NoSQL - IAI**

**Année Académique 2025-2026**

---

![MongoDB](https://img.shields.io/badge/MongoDB-4.4.6-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-Educational-blue?style=for-the-badge)

</div>

---

##  Description du projet

Une plateforme de vente de billets pour concerts et événements à Libreville. Les utilisateurs réservent des places ; le paiement doit être confirmé sous dix minutes, sinon la réservation expire et les places sont relibérées.

###  Focus NoSQL

**Index TTL et expiration automatique** - Exploitation d'un index TTL pour faire expirer automatiquement les réservations non payées, et discussion du rôle de Redis pour les sessions.

---

##  Collections principales

| Collection | Description | Index |
|------------|-------------|-------|
| **utilisateurs** | Informations sur les utilisateurs | `{ email: 1 }` |
| **evenements** | Informations sur les concerts et événements | `{ date: 1, lieu: 1 }`, `{ prix: 1 }`, `{ titre: "text", description: "text" }` |
| **reservations** | Réservations des utilisateurs (avec TTL) | `{ date_creation: 1 }` (TTL: 600s) |
| **billets** | Billets générés après paiement | - |

---

##  Installation et configuration

###  Prérequis

- [MongoDB](https://www.mongodb.com/try/download/community) (local ou Atlas)
- [mongosh](https://www.mongodb.com/try/download/shell) (MongoDB Shell)

###  Étapes d'installation

#### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-groupe/billetterie-nosql.git
cd billetterie-nosql
```

#### 2. Se connecter à MongoDB

**MongoDB Atlas (recommandé) :**
```bash
mongosh "mongodb+srv://votre_user:votre_password@cluster.mongodb.net/billetterie"
```

**MongoDB Local :**
```bash
mongosh
```

> 💡 **Pour MongoDB Atlas :**
> 1. Créer un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
> 2. Créer un cluster M0 (gratuit)
> 3. Créer un utilisateur de base de données
> 4. Whitelister l'IP `0.0.0.0/0` (pour le développement)
> 5. Copier la chaîne de connexion

#### 3. Peupler la base de données

```bash
mongosh load("data/seed.js")
```

Cette commande insère :
-  35 utilisateurs avec des noms gabonais
-  30 événements
-  35 réservations
-  Des billets pour les réservations confirmées

#### 4. Exécuter les scripts de démonstration

```bash
# Opérations CRUD
mongosh load("scripts/01-crud.js")

# Requêtes avancées
mongosh load("scripts/02-requetes.js")

# Agrégations
mongosh load("scripts/03-agregations.js")

# Indexation et analyse des performances
mongosh load("scripts/04-index.js")
```

---

##  Structure du dépôt

```
billetterie-nosql/
├─  README.md
├─  conception/
│   ├─  modele-donnees.md (à convertir en PDF)
│   └─  schema.md (à convertir en PNG)
├─  data/
│   └─  seed.js
├─ scripts/
│   ├─  01-crud.js
│   ├─  02-requetes.js
│   ├─  03-agregations.js
│   └─  04-index.js
├─  explain/
│   └─  explain-avant-apres.md (à convertir en PDF)
├─  rapport/
│   └─  rapport.md (à convertir en PDF)
└─ api/ (optionnel - API REST Node.js)
```

---

##  Livrables

### Socle obligatoire

| Livrable | Fichier | Statut |
|----------|---------|--------|
| Conception | `conception/modele-donnees.md` | ✅|
| Schéma visuel | `conception/schema.md` | ✅ |
| Données de test | `data/seed.js` | ✅ |
| Opérations CRUD | `scripts/01-crud.js` | ✅ |
| Requêtes avancées | `scripts/02-requetes.js` | ✅ |
| Agrégations | `scripts/03-agregations.js` | ✅ |
| Indexation & performance | `scripts/04-index.js` | ✅ |
| Analyse explain | `explain/explain-avant-apres.md` | ✅ |
| Rapport écrit | `rapport/rapport.md` | ✅ |
| Dépôt Git + README | - | ✅ |

###  Livrables spécifiques Groupe 9

- ✅ Index TTL sur les réservations (expiration 10 minutes)
- ✅ Décrément/réincrément automatique des places
- ✅ Agrégation des recettes par événement
- ✅ Gestion de la concurrence (pas de survente)

### Bonus (optionnel)

- ✅ API REST Node.js dans le dossier `api/` (+2 points)
- ✅ Collection Postman documentée (+1 point)
- ⏳ Déploiement VPS (+2 points)

---

## � Index créés

Le script `scripts/04-index.js` crée les index suivants :

| Collection | Type de l'index | Configuration | Justification |
|------------|-----------------|---------------|---------------|
| **evenements** | Composé | `{ date: 1, lieu: 1 }` | Optimise les recherches par date et lieu combinées |
| **evenements** | Simple | `{ prix: 1 }` | Optimise les filtres par fourchette de prix |
| **evenements** | Text | `{ titre: "text", description: "text" }` | Permet la recherche plein texte |
| **utilisateurs** | Simple | `{ email: 1 }` | Optimise l'authentification par email |
| **reservations** | TTL | `{ date_creation: 1 }` (600s) | Supprime automatiquement les réservations non payées |

---

##  Comparaison SQL vs NoSQL

###  Avantages de MongoDB pour ce projet

| Avantage | Description |
|----------|-------------|
| **Schéma flexible** | Les événements peuvent avoir des attributs variables (artistes, types de billets) |
| **Index TTL natif** | Expiration automatique des documents sans cron externe |
| **Mises à jour atomiques** | Gestion de la concurrence sans transactions complexes |
| **Agrégation puissante** | Pipeline d'agrégation pour les statistiques de recettes |
| **Scalabilité horizontale** | Facile à scaler avec sharding si le volume augmente |

###  Limites par rapport au relationnel

| Limite | Description |
|--------|-------------|
| **Pas de jointures natives** | Utilisation de $lookup moins performant que les JOIN SQL |
| **Transactions limitées** | Plus complexes à mettre en œuvre qu'en SQL |
| **Schéma dynamique** | Risque d'incohérence si mal géré |

---

##  Documentation

| Document | Emplacement | Format |
|----------|-------------|--------|
| Conception | `conception/modele-donnees.md` | Markdown → PDF |
| Schéma | `conception/schema.md` | Mermaid → PNG |
| Rapport | `rapport/rapport.md` | Markdown → PDF |
| Analyse explain | `explain/explain-avant-apres.md` | Markdown → PDF |

---

##  Équipe

Ce projet est réalisé dans le cadre du module Bases de données NoSQL de l'Université Omar Bongo.

| Membre | Rôle |
|--------|------|
| ONIANDJI Jude | Modèles, indexation, seed |
| BOUALA NUKAFO Kingsy Jones | API REST, contrôleurs |
| MINDZELI Arnold| Frontend, tests, documentation |

---

##  Licence

Ce projet est réalisé à des fins pédagogiques dans le cadre d'un projet universitaire.

---

<div align="center">

**IAI - Master I - Bases de données NoSQL**

**Année Académique 2025-2026**

</div>
