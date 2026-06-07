# Présentation Orale - Plateforme de Billetterie Événementielle

**Groupe 9 :** ONIANDJI Jude, BOUALA NUKAFO Kingsy Jones, MAKAYA Taliane  
**Module :** Bases de données NoSQL - Master I  
**Année Académique :** 2025-2026

---

## Structure de la présentation (15 minutes)

### 1. Introduction (2 minutes)
- Présentation du groupe
- Présentation du sujet
- Objectifs du projet

### 2. Contexte et besoins fonctionnels (2 minutes)
- Description de la plateforme
- Besoins fonctionnels
- Focus NoSQL du groupe

### 3. Modélisation des données (3 minutes)
- Collections principales
- Structure des documents
- Justification embedding vs referencing

### 4. Implémentation technique (3 minutes)
- Stack technique
- Opérations CRUD
- API REST
- Données de test

### 5. Focus NoSQL - Index TTL (2 minutes)
- Principe de l'index TTL
- Implémentation
- Worker TTL pour restitution des places
- Rôle de Redis

### 6. Indexation et performance (2 minutes)
- Index créés
- Analyse explain()
- Justification des index

### 7. Requêtes avancées et agrégation (1 minute)
- Pipeline d'agrégation
- Recettes par événement

### 8. Comparaison SQL vs NoSQL (1 minute)
- Avantages de MongoDB
- Limites
- Quand choisir MongoDB vs SQL

### 9. Conclusion et démonstration (5 minutes)
- Points forts
- Difficultés rencontrées
- Démonstration live
- Questions

---

## Diapositives détaillées

### Diapositive 1 : Titre

**Plateforme de Billetterie Événementielle**

Groupe 9 : ONIANDJI Jude, BOUALA NUKAFO Kingsy Jones, MAKAYA Taliane

Module : Bases de données NoSQL - Master I
Année Académique : 2025-2026

---

### Diapositive 2 : Introduction

**Présentation du sujet**

- Contexte : Plateforme de vente de billets pour concerts et événements à Libreville
- Fonctionnalité clé : Réservation avec paiement à confirmer sous 10 minutes
- Expiration automatique : Les réservations non payées expirent et les places sont relibérées

**Objectifs du projet**

- Concevoir un modèle de données NoSQL adapté
- Implémenter les opérations CRUD
- Créer des requêtes avancées et agrégations
- Optimiser les performances par indexation
- Mettre en valeur l'index TTL (Focus NoSQL)

---

### Diapositive 3 : Contexte et besoins fonctionnels

**Besoins fonctionnels**

- Création et gestion d'événements (concerts, spectacles)
- Réservation de places par les utilisateurs
- Gestion des paiements avec délai de confirmation (10 minutes)
- Génération automatique de billets après paiement
- Expiration automatique des réservations non payées
- Suivi des recettes par événement
- Gestion de la capacité des événements (pas de survente)

**Focus NoSQL - Index TTL**

- Exploiter un index TTL pour expiration automatique
- Discuter du rôle de Redis pour les sessions

---

### Diapositive 4 : Modélisation des données

**Collections principales**

1. **utilisateurs** - Informations sur les utilisateurs
2. **evenements** - Informations sur les concerts et événements
3. **reservations** - Réservations des utilisateurs (avec TTL)
4. **billets** - Billets générés après paiement

**Données ancrées dans le contexte gabonais**

- Noms : Ndong, Moussavou, Mba, Obame, Biyoghe, Ngoma...
- Villes : Libreville, Port-Gentil, Franceville, Owendo, Akanda
- Prix : En FCFA (5000, 10000, 15000...)
- Téléphones : Format +241 ou 06x/07x

---

### Diapositive 5 : Justification Embedding vs Referencing

**Réservation : Referencing**

- Indépendance des données (utilisateur et événement peuvent évoluer)
- Éviter la redondance
- Documents légers pour de meilleures performances
- Flexibilité avec $lookup pour les agrégations

**Événement - Artistes : Embedding**

- Cardinalité faible (1-10 artistes par événement)
- Cohésion des données
- Performance : une seule lecture
- Stabilité de la liste des artistes

**Billet : Referencing**

- Traçabilité (lien avec réservation, événement, utilisateur)
- Flexibilité (statut indépendant)
- Agrégations possibles via $lookup

---

### Diapositive 6 : Implémentation technique

**Stack technique**

- Backend : Node.js, Express
- Base de données : MongoDB Atlas (Mongoose)
- Frontend : HTML, CSS, JavaScript (vanilla)
- Tests : Postman Collection

**Opérations CRUD implémentées**

- Create : insertOne / insertMany
- Read : find avec filtres et projection
- Update : updateOne / updateMany ($set, $inc, $push, $pull)
- Delete : deleteOne / deleteMany

**API REST**

- GET /api/evenements - Lister les événements
- POST /api/evenements - Créer un événement
- POST /api/reservations - Créer une réservation
- POST /api/reservations/:id/payer - Confirmer le paiement
- GET /api/evenements/stats/recettes - Recettes par événement

---

### Diapositive 7 : Focus NoSQL - Index TTL

**Principe de l'index TTL**

L'index TTL (Time-To-Live) de MongoDB permet de supprimer automatiquement des documents après un certain délai.

**Implémentation**

```javascript
reservationSchema.index(
  { date_creation: 1 },
  {
    expireAfterSeconds: 600, // 10 minutes
    partialFilterExpression: { statut: "EN_ATTENTE" }
  }
);
```

**Fonctionnement**

- MongoDB vérifie régulièrement les documents avec un index TTL
- Si date_creation + 600 secondes < maintenant ET statut == "EN_ATTENTE", le document est supprimé
- Le partialFilterExpression garantit que seules les réservations non confirmées sont supprimées

---

### Diapositive 8 : Worker TTL pour restitution des places

**Problème**

L'index TTL supprime les réservations expirées, mais ne réincrémente pas automatiquement les places disponibles.

**Solution : Worker TTL**

Un worker (`ttlWorker.js`) qui :

1. Surveille les réservations en attente vieilles de plus de 10 minutes
2. Réincrémente les places disponibles dans l'événement correspondant
3. Passe le statut de la réservation à "EXPIREE"

**Rôle de Redis (vu en théorie)**

- Sessions utilisateur avec expiration automatique
- Panier temporaire
- Cache des places disponibles en temps réel
- Notifications en temps réel (Pub/Sub)

---

### Diapositive 9 : Gestion de la concurrence

**Défi technique**

Garantir qu'on ne vende jamais plus de places que la capacité de l'événement, même avec des requêtes concurrentes.

**Solution : Mise à jour atomique avec condition**

```javascript
const updateResult = await Evenement.updateOne(
  { 
    _id: evenement_id, 
    places_disponibles: { $gte: nombre_places } // Condition stricte
  },
  { 
    $inc: { places_disponibles: -nombre_places } // Décrémentation atomique
  }
);

if (updateResult.modifiedCount === 0) {
  return res.status(400).json({ message: "Places insuffisantes" });
}
```

Cette approche garantit l'atomicité sans transactions complexes.

---

### Diapositive 10 : Indexation et performance

**Index créés (5 index)**

1. `{ date: 1, lieu: 1 }` - Index composé pour recherches par date et lieu
2. `{ prix: 1 }` - Index pour filtres par prix
3. `{ titre: "text", description: "text" }` - Index text pour recherche plein texte
4. `{ email: 1 }` - Index pour authentification par email
5. `{ date_creation: 1 }` (TTL) - Index TTL pour expiration automatique

**Analyse explain()**

- Avant indexation : COLLSCAN (scan complet)
- Après indexation : IXSCAN (scan d'index)
- Réduction du nombre de documents examinés
- Amélioration du temps d'exécution

---

### Diapositive 11 : Requêtes avancées et agrégation

**Opérateurs utilisés**

- Comparaison : $lte, $gte, $eq
- Logiques : $and, $or
- Tableaux : $push, $pull
- Mise à jour : $set, $inc
- Regex : $regex avec $options: "i"
- Text search : $text avec $search

**Pipeline d'agrégation - Recettes par événement**

```javascript
Reservation.aggregate([
  { $match: { statut: "CONFIRMEE" } },
  { $group: { _id: "$evenement_id", recettes_totales: { $sum: "$montant_total" } } },
  { $lookup: { from: "evenements", localField: "_id", foreignField: "_id", as: "details" } },
  { $unwind: "$details" },
  { $project: { titre: "$details.titre", recettes_FCFA: "$recettes_totales" } },
  { $sort: { recettes_FCFA: -1 } }
])
```

---

### Diapositive 12 : Comparaison SQL vs NoSQL

**Avantages de MongoDB**

- Schéma flexible pour données variables
- Index TTL natif (pas de cron externe)
- Mises à jour atomiques simples
- Agrégation puissante
- Scalabilité horizontale (sharding)
- Documents auto-contenus (moins de jointures)

**Limites par rapport au relationnel**

- Pas de jointures natives ($lookup moins performant)
- Transactions multi-documents plus complexes
- Schéma dynamique (risque d'incohérence)
- Moins mature que les SGBDR

**Quand choisir MongoDB vs SQL**

- MongoDB : Schéma évolutif, données hiérarchiques, scalabilité horizontale
- SQL : Données fortement structurées, intégrité critique, transactions ACID strictes

---

### Diapositive 13 : Difficultés rencontrées

**1. Gestion de la concurrence**

- Problème : Éviter la survente de places
- Solution : Mise à jour atomique avec condition $gte

**2. Expiration TTL et restitution des places**

- Problème : TTL ne réincrémente pas les places
- Solution : Worker TTL qui surveille et restitue

**3. Structure du résultat explain()**

- Problème : Structure varie selon version MongoDB
- Solution : Adaptation du script pour gérer différentes structures

**4. Index dupliqués**

- Problème : Erreur lors de création d'index existants
- Solution : Gestion des erreurs dans le script

---

### Diapositive 14 : Points forts du projet

- Modélisation pertinente avec choix justifiés embedding/referencing
- 5 index créés avec justification (dont 1 TTL et 1 composé)
- Gestion de la concurrence élégante (mises à jour atomiques)
- Pipeline d'agrégation complet pour recettes par événement
- API REST fonctionnelle avec filtres, pagination, recherche textuelle
- Données de test réalistes et ancrées dans le contexte gabonais
- Documentation complète (README, conception, rapport)

---

### Diapositive 15 : Démonstration live

**Plan de la démonstration**

1. Lancer le serveur : `npm start`
2. Afficher le frontend : http://localhost:5000
3. Créer un événement via Postman
4. Créer une réservation (décrément des places)
5. Attendre 10 minutes pour voir l'expiration TTL
6. Confirmer un paiement (génération de billets)
7. Afficher les recettes par événement
8. Montrer les index créés : `node scripts/createIndexes.js`
9. Montrer l'analyse explain() : `node scripts/explainAnalysis.js`

---

### Diapositive 16 : Conclusion

**Conclusion**

Ce projet nous a permis de :
- Mettre en pratique les notions du module NoSQL
- Comprendre les forces et limites de MongoDB
- Expérimenter l'index TTL pour expiration automatique
- Résoudre des problèmes concrets (concurrence, expiration)

**Perspectives**

- Ajouter l'authentification JWT
- Implémenter Redis pour le cache
- Ajouter des tests unitaires
- Déployer sur VPS (bonus)

**Questions ?**

---

## Notes pour la présentation

### Répartition des tâches

- **ONIANDJI Jude** : Modèles, indexation, seed
- **BOUALA NUKAFO Kingsy Jones** : API REST, contrôleurs
- **MAKAYA Taliane** : Frontend, tests, documentation

### Points à mettre en valeur

1. **Focus NoSQL** : Insister sur l'index TTL et son utilité pour l'expiration automatique
2. **Gestion de la concurrence** : Expliquer clairement la solution avec mise à jour atomique
3. **Choix de modélisation** : Justifier chaque choix embedding/referencing
4. **Indexation** : Montrer les gains de performance avec explain()
5. **Données gabonaises** : Mentionner que les données sont réalistes et ancrées localement

### Démonstration live

- Préparer le serveur lancé avant la présentation
- Avoir Postman ouvert avec les requêtes prêtes
- Avoir MongoDB Compass ouvert pour montrer les collections
- Montrer le frontend fonctionnel
- Préparer les captures d'écran des résultats explain()

### Questions possibles et réponses

**Q : Pourquoi avoir choisi MongoDB plutôt qu'une base relationnelle ?**

R : MongoDB est adapté pour ce projet car : (1) le schéma est flexible (artistes variables), (2) l'index TTL natif évite un cron externe, (3) les mises à jour atomiques simplifient la gestion de concurrence, (4) l'agrégation est puissante pour les statistiques.

**Q : Comment garantissez-vous qu'on ne vende pas plus de places que la capacité ?**

R : Nous utilisons une mise à jour atomique avec condition : `updateOne({ _id: id, places_disponibles: { $gte: nb } }, { $inc: { places_disponibles: -nb } })`. Si la condition n'est pas remplie, modifiedCount est 0 et nous refusons la réservation.

**Q : Pourquoi ne pas avoir utilisé Redis pour l'expiration ?**

R : Le focus du projet est l'index TTL de MongoDB. Redis aurait pu être utilisé pour les sessions ou le cache, mais MongoDB TTL est suffisant pour notre besoin d'expiration des réservations.

**Q : Comment gère-t-on la restitution des places après expiration ?**

R : Un worker TTL surveille les réservations en attente vieilles de plus de 10 minutes, réincrémente les places disponibles dans l'événement, et passe le statut à "EXPIREE".

**Q : Quels sont les avantages de l'embedding par rapport au referencing ?**

R : L'embedding est avantageux quand : (1) la cardinalité est faible, (2) les données sont cohérentes, (3) on veut éviter les jointures, (4) les données sont stables. Le referencing est préférable quand : (1) les données peuvent évoluer indépendamment, (2) on veut éviter la redondance, (3) on a besoin de flexibilité.

---

## Matériel pour la démonstration

### Pré-requis

- Serveur lancé : `npm start`
- MongoDB Compass connecté
- Postman ouvert avec collection importée
- Navigateur sur http://localhost:5000

### Scripts à exécuter pendant la démo

```bash
# Créer les index
node scripts/createIndexes.js

# Analyse avant indexation
node scripts/explainAnalysis.js

# Analyse après indexation
node scripts/explainAfterIndexes.js

# Peupler la base (si nécessaire)
node seed.js
```

### Requêtes Postman à montrer

1. GET http://localhost:5000/api/evenements
2. POST http://localhost:5000/api/evenements (créer événement)
3. POST http://localhost:5000/api/reservations (créer réservation)
4. POST http://localhost:5000/api/reservations/:id/payer (confirmer paiement)
5. GET http://localhost:5000/api/evenements/stats/recettes (recettes)

---

**Fin de la présentation**
