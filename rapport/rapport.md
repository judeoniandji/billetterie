 Rapport de Projet - Plateforme de Billetterie Événementielle

**Groupe 9 :** ONIANDJI Jude, BOUALA NUKAFO Kingsy Jones, MAKAYA Taliane  
**Module :** Bases de données NoSQL - Master I  
**Année Académique :** 2025-2026  
**Encadrant :** [À compléter]

---

 Table des matières

1. [Introduction](1-introduction)
2. [Présentation du sujet](2-présentation-du-sujet)
3. [Modélisation des données](3-modélisation-des-données)
4. [Implémentation technique](4-implémentation-technique)
5. [Focus NoSQL - Index TTL](5-focus-nosql---index-ttl)
6. [Indexation et performance](6-indexation-et-performance)
7. [Requêtes avancées et agrégation](7-requêtes-avancées-et-agrégation)
8. [Comparaison SQL vs NoSQL](8-comparaison-sql-vs-nosql)
9. [Difficultés rencontrées](9-difficultés-rencontrées)
10. [Conclusion](10-conclusion)

---

 1. Introduction

Ce projet constitue l'évaluation pratique du module "Bases de données NoSQL" du Master I de l'Université Omar Bongo. L'objectif est de concevoir et réaliser une solution de données complète reposant sur MongoDB, depuis la modélisation jusqu'aux requêtes d'agrégation et à l'optimisation par index.

Notre groupe (Groupe 9) a travaillé sur le thème "Plateforme de Billetterie Événementielle", une application de vente de billets pour concerts et événements à Libreville. Le focus NoSQL de ce thème est l'index TTL (Time-To-Live) pour l'expiration automatique des réservations non payées.

---

 2. Présentation du sujet

 2.1 Contexte

Une plateforme de vente de billets pour concerts et événements à Libreville permet aux utilisateurs de réserver des places en ligne. Le paiement doit être confirmé sous dix minutes, sinon la réservation expire et les places sont relibérées pour d'autres utilisateurs.

 2.2 Besoins fonctionnels

- Création et gestion d'événements (concerts, spectacles)
- Réservation de places par les utilisateurs
- Gestion des paiements avec délai de confirmation (10 minutes)
- Génération automatique de billets après paiement
- Expiration automatique des réservations non payées
- Suivi des recettes par événement
- Gestion de la capacité des événements (pas de survente)

 2.3 Focus NoSQL

Le focus NoSQL du Groupe 9 est l'**index TTL et expiration automatique**. L'objectif est d'exploiter un index TTL pour faire expirer automatiquement les réservations non payées après 10 minutes, et de discuter du rôle de Redis pour les sessions (vu en théorie).

 2.4 Livrables spécifiques

- Index TTL sur les réservations non confirmées, avec expiration après dix minutes
- Décrément et réincrément automatiques des places disponibles selon le cycle de réservation
- Requête d'agrégation des recettes par événement
- Endpoint de réservation refusant la vente au-delà de la capacité de l'événement

 2.5 Défi technique

Le défi technique est de garantir qu'on ne vende jamais plus de places que la capacité de l'événement (gestion de concurrence).

---

 3. Modélisation des données

 3.1 Collections principales

Nous avons défini quatre collections principales :

1. **utilisateurs** - Informations sur les utilisateurs
2. **evenements** - Informations sur les concerts et événements
3. **reservations** - Réservations des utilisateurs (avec TTL)
4. **billets** - Billets générés après paiement

 3.2 Structure des collections

 Collection `utilisateurs`

```javascript
{
  _id: ObjectId,
  nom: String (required),
  prenom: String (required),
  email: String (required),
  telephone: String (required, match: /^(?:\+241|0)[1-7][0-9]{6,7}$/),
  ville: String (enum: ["Libreville", "Port-Gentil", "Franceville", "Owendo", "Akanda"]),
  role: String (enum: ["client", "admin"], default: "client"),
  createdAt: Date,
  updatedAt: Date
}
```

 Collection `evenements`

```javascript
{
  _id: ObjectId,
  titre: String (required),
  description: String,
  date: Date (required),
  lieu: String (required),
  prix: Number (required, min: 0), // En FCFA
  capacite_totale: Number (required, min: 1),
  places_disponibles: Number (required, min: 0),
  image: String,
  artistes: [{ 
    nom: String, 
    heure_passage: String 
  }],
  createdAt: Date,
  updatedAt: Date
}
```

 Collection `reservations`

```javascript
{
  _id: ObjectId,
  utilisateur_id: ObjectId (ref: "Utilisateur", required),
  evenement_id: ObjectId (ref: "Evenement", required),
  nombre_places: Number (required, min: 1),
  statut: String (enum: ["EN_ATTENTE", "CONFIRMEE", "EXPIREE"], default: "EN_ATTENTE"),
  montant_total: Number (required),
  date_creation: Date (default: Date.now)
}
```

 Collection `billets`

```javascript
{
  _id: ObjectId,
  reservation_id: ObjectId (ref: "Reservation", required),
  evenement_id: ObjectId (ref: "Evenement", required),
  utilisateur_id: ObjectId (ref: "Utilisateur", required),
  code_barre: String (required, unique),
  statut: String (enum: ["VALIDE", "UTILISE", "ANNULE"], default: "VALIDE"),
  createdAt: Date,
  updatedAt: Date
}
```

 3.3 Justification des choix Embedding vs Referencing

 Réservation : Referencing

**Choix :** Référencement (Referencing) pour `utilisateur_id` et `evenement_id`

**Justification :**

1. **Indépendance des données** : Les informations de l'utilisateur (email, téléphone) et de l'événement (prix, date) peuvent évoluer indépendamment de la réservation. Une réservation n'est qu'un "lien" temporaire entre un utilisateur et un événement.

2. **Éviter la redondance** : Si nous embarquions (embed) les informations de l'utilisateur et de l'événement dans chaque réservation, une modification de l'email de l'utilisateur nécessiterait de mettre à jour toutes ses réservations.

3. **Taille des documents** : Les documents de réservation restent légers, ce qui améliore les performances des requêtes.

4. **Flexibilité** : Le référencement permet de récupérer les informations à jour via `$lookup` lors des agrégations.

 Événement - Artistes : Embedding

**Choix :** Imbrication (Embedding) pour `artistes`

**Justification :**

1. **Cardinalité faible** : Un événement a généralement un nombre limité d'artistes (1-10), ce qui respecte la limite de 16 Mo de MongoDB.

2. **Cohésion des données** : Les artistes sont intrinsèquement liés à l'événement. Ils sont toujours affichés ensemble.

3. **Performance** : Une seule lecture suffit pour récupérer l'événement et ses artistes, sans jointure.

4. **Stabilité** : La liste des artistes d'un événement change rarement après sa création.

 Billet : Referencing

**Choix :** Référencement (Referencing) pour `reservation_id`, `evenement_id`, `utilisateur_id`

**Justification :**

1. **Traçabilité** : Chaque billet doit pouvoir être relié à sa réservation d'origine, à l'événement et à l'utilisateur pour le contrôle d'accès.

2. **Flexibilité** : Un billet peut changer de statut (VALIDE → UTILISE) indépendamment de la réservation.

3. **Agrégations** : Les références permettent de calculer des statistiques (billets par événement, billets par utilisateur) via `$lookup`.

4. **Taille** : Les documents de billet restent légers avec seulement des références ObjectId.

---

 4. Implémentation technique

 4.1 Stack technique

- **Backend** : Node.js, Express
- **Base de données** : MongoDB Atlas (Mongoose)
- **Frontend** : HTML, CSS, JavaScript (vanilla)
- **Tests** : Postman Collection

 4.2 Opérations CRUD

Nous avons implémenté toutes les opérations CRUD requises :

 Create (insertOne / insertMany)

```javascript
// Création d'un événement
const nouvelEvenement = new Evenement(req.body);
const eventSauvegarde = await nouvelEvenement.save();

// Insertion multiple (seed)
const utilisateurs = await Utilisateur.insertMany(utilisateursData);
```

 Read (find avec filtres et projection)

```javascript
// Recherche avec filtres
const filtres = {};
if (req.query.lieu) filtres.lieu = { $regex: req.query.lieu, $options: "i" };
if (req.query.prix_max) filtres.prix = { $lte: Number(req.query.prix_max) };

const evenements = await Evenement.find(filtres).sort({ date: 1 });
```

 Update (updateOne / updateMany avec $set, $inc, $push, $pull)

```javascript
// Mise à jour avec $set
const eventMisAJour = await Evenement.findByIdAndUpdate(
  req.params.id, 
  { $set: req.body }, 
  { new: true, runValidators: true }
);

// Décrémentation atomique avec $inc
await Evenement.updateOne(
  { _id: evenement_id, places_disponibles: { $gte: nombre_places } },
  { $inc: { places_disponibles: -nombre_places } }
);
```

 Delete (deleteOne / deleteMany)

```javascript
const eventSupprime = await Evenement.findByIdAndDelete(req.params.id);
```

 4.3 API REST

Nous avons développé une API REST complète avec les endpoints suivants :

 Événements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/evenements` | Lister tous les événements (avec filtres et pagination) |
| POST | `/api/evenements` | Créer un nouvel événement |
| PUT | `/api/evenements/:id` | Mettre à jour un événement |
| DELETE | `/api/evenements/:id` | Supprimer un événement |
| GET | `/api/evenements/stats/recettes` | Agréger les recettes par événement |

 Réservations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/reservations` | Créer une réservation (avec gestion de concurrence) |
| POST | `/api/reservations/:id/payer` | Confirmer le paiement et générer les billets |

 4.4 Données de test

Les données de test sont ancrées dans le contexte gabonais :

- **Noms** : Ndong, Moussavou, Mba, Obame, Biyoghe, Ngoma, Koumba, Nziengui, Nzoghe, Essono
- **Prénoms** : Jude, Alain, Chancia, Marc, Sylvie, Kevin, Grace, Hervé, Léa, Paul
- **Villes** : Libreville, Port-Gentil, Franceville, Owendo, Akanda
- **Lieux** : Stade de l'Amitié, Institut Français, Palais des Sports, Casino Croisette
- **Prix** : En FCFA (5000, 10000, 15000, etc.)
- **Téléphones** : Format +241 ou 06x/07x

Le script `seed.js` insère :
- 35 utilisateurs
- 30 événements
- 35 réservations
- Des billets pour les réservations confirmées

---

 5. Focus NoSQL - Index TTL

 5.1 Principe de l'index TTL

L'index TTL (Time-To-Live) de MongoDB permet de supprimer automatiquement des documents après un certain délai. C'est une fonctionnalité native qui évite d'avoir à implémenter un cron externe pour la suppression de données expirées.

 5.2 Implémentation

```javascript
reservationSchema.index(
  { date_creation: 1 },
  {
    expireAfterSeconds: 600, // 10 minutes
    partialFilterExpression: { statut: "EN_ATTENTE" }
  }
);
```

**Fonctionnement :**
- MongoDB vérifie régulièrement les documents avec un index TTL
- Si `date_creation + 600 secondes < maintenant` ET `statut == "EN_ATTENTE"`, le document est supprimé
- Le `partialFilterExpression` garantit que seules les réservations non confirmées sont supprimées

 5.3 Worker TTL pour restitution des places

L'index TTL supprime les réservations expirées, mais ne réincrémente pas automatiquement les places disponibles. Pour cela, nous avons implémenté un worker (`ttlWorker.js`) qui :

1. Surveille les réservations en attente vieilles de plus de 10 minutes
2. Réincrémente les places disponibles dans l'événement correspondant
3. Passe le statut de la réservation à "EXPIREE"

```javascript
setInterval(async () => {
  const dixMinutesAvant = new Date(Date.now() - 10 * 60 * 1000);
  
  const reservationsExpirees = await Reservation.find({
    statut: "EN_ATTENTE",
    date_creation: { $lt: dixMinutesAvant }
  });

  for (const res of reservationsExpirees) {
    await Evenement.findByIdAndUpdate(res.evenement_id, {
      $inc: { places_disponibles: res.nombre_places }
    });
    
    res.statut = "EXPIREE";
    await res.save();
  }
}, 60000); // Vérification toutes les minutes
```

 5.4 Rôle de Redis pour les sessions (vu en théorie)

**Pourquoi Redis serait pertinent :**

1. **Sessions utilisateur** : Stocker les sessions utilisateur avec une expiration automatique (similaire au TTL MongoDB)
2. **Panier temporaire** : Pour un e-commerce, Redis est idéal pour stocker les paniers non validés
3. **Performance** : Redis est en mémoire, donc plus rapide que MongoDB pour les données temporaires
4. **Pub/Sub** : Pour la notification en temps réel (ex: places disponibles)

**Dans notre projet :**
- Nous utilisons MongoDB TTL pour les réservations (focus du sujet)
- Redis pourrait être utilisé pour :
  - Stocker les sessions utilisateur authentifiées
  - Gérer un cache des places disponibles en temps réel
  - Implémenter un système de notifications WebSocket

---

 6. Indexation et performance

 6.1 Index créés

| Collection | Index | Justification |
|------------|-------|--------------|
| evenements | `{ date: 1, lieu: 1 }` | Optimise les recherches par date et lieu combinées |
| evenements | `{ prix: 1 }` | Optimise les filtres par fourchette de prix |
| evenements | `{ titre: "text", description: "text" }` | Permet la recherche plein texte sémantique |
| utilisateurs | `{ email: 1 }` | Optimise l'authentification par email |
| reservations | `{ date_creation: 1 }` (TTL) | Supprime automatiquement les réservations non payées après 10 min |

 6.2 Analyse explain()

Nous avons réalisé une analyse des performances avant et après la création des index en utilisant la méthode `explain("executionStats")`.

 Résultats avant indexation

**TEST 1 : Recherche par lieu 'Libreville'**
- Stage : COLLSCAN (scan complet de la collection)
- Documents examinés : 30 (tous les événements)
- Temps d'exécution : 0 ms

**TEST 2 : Recherche par prix <= 15000**
- Stage : FETCH
- Documents examinés : 7
- Temps d'exécution : 1 ms

**TEST 3 : Recherche composée date + lieu**
- Stage : FETCH
- Documents examinés : 0
- Temps d'exécution : 1 ms

**TEST 4 : Recherche par email**
- Stage : FETCH
- Documents examinés : 0
- Temps d'exécution : 1 ms

 Résultats après indexation

Les résultats après indexation montrent une amélioration des performances, bien que le volume de données (30 documents) soit trop faible pour observer des différences significatives. Avec un volume plus important (1000+ documents), les gains seraient beaucoup plus marqués.

 6.3 Justification des index

1. **Index composé (date, lieu)** : Les utilisateurs recherchent souvent des événements par date et par lieu. Ce composé permet d'optimiser les requêtes du type "Quels événements à Libreville en décembre ?"

2. **Index sur prix** : Permet aux utilisateurs de filtrer les événements par fourchette de prix. Optimise les requêtes avec $lte ou $gte sur le champ prix.

3. **Index text (titre, description)** : Permet aux utilisateurs de rechercher des événements par mots-clés dans le titre et la description. Optimise les requêtes avec l'opérateur $text pour la recherche sémantique.

4. **Index sur email** : L'email est unique et utilisé pour identifier les utilisateurs lors de l'authentification. Cet index optimise les requêtes findByEmail.

5. **Index TTL** : Le cahier des charges exige que les réservations expirent après 10 minutes sans paiement. Cet index TTL dit à MongoDB de supprimer automatiquement les documents après 10 minutes si le statut est "EN_ATTENTE".

---

 7. Requêtes avancées et agrégation

 7.1 Opérateurs utilisés

Nous avons utilisé les opérateurs suivants :

- **Opérateurs de comparaison** : `$lte`, `$gte`, `$eq`
- **Opérateurs logiques** : `$and` (implicite), `$or`
- **Opérateurs sur tableaux** : `$push`, `$pull`
- **Opérateurs de mise à jour** : `$set`, `$inc`
- **Regex** : `$regex` avec `$options: "i"` pour insensibilité à la casse
- **Text search** : `$text` avec `$search`

 7.2 Tri, pagination et comptage

```javascript
// Tri
const evenements = await Evenement.find(filtres).sort({ date: 1 });

// Pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const evenements = await Evenement.find(filtres)
  .skip(skip)
  .limit(limit);

// Comptage
const total = await Evenement.countDocuments(filtres);
```

 7.3 Pipeline d'agrégation - Recettes par événement

```javascript
const statsRecettes = await Reservation.aggregate([
  // 1. Filtrer uniquement les réservations confirmées (payées)
  { $match: { statut: "CONFIRMEE" } },
  
  // 2. Grouper par événement et sommer le montant_total
  { 
    $group: {
      _id: "$evenement_id",
      recettes_totales: { $sum: "$montant_total" },
      billets_vendus: { $sum: "$nombre_places" }
    }
  },
  
  // 3. Faire une jointure (lookup) avec la collection evenements
  {
    $lookup: {
      from: "evenements",
      localField: "_id",
      foreignField: "_id",
      as: "details_evenement"
    }
  },
  
  // 4. Déconstruire le tableau details_evenement
  { $unwind: "$details_evenement" },
  
  // 5. Projeter les champs à retourner
  {
    $project: {
      _id: 0,
      id_evenement: "$_id",
      titre: "$details_evenement.titre",
      recettes_FCFA: "$recettes_totales",
      billets_vendus: "$billets_vendus"
    }
  },
  
  // 6. Trier par recettes décroissantes
  { $sort: { recettes_FCFA: -1 } }
]);
```

**Étapes du pipeline :**
1. `$match` : Filtre les réservations confirmées
2. `$group` : Groupe par événement et calcule les totaux
3. `$lookup` : Jointure avec la collection evenements
4. `$unwind` : Déconstruit le tableau résultant
5. `$project` : Projette les champs à retourner
6. `$sort` : Trie par recettes décroissantes

---

 8. Comparaison SQL vs NoSQL

 8.1 Avantages de MongoDB pour ce projet

1. **Schéma flexible** : Les événements peuvent avoir des attributs variables (artistes, types de billets, etc.) sans avoir à modifier la structure de la base de données.

2. **Index TTL natif** : Expiration automatique des documents sans cron externe. En SQL, il faudrait implémenter un job planifié pour supprimer les enregistrements expirés.

3. **Mises à jour atomiques** : Gestion de la concurrence sans transactions complexes. L'opérateur `$inc` avec condition permet de garantir l'atomicité.

4. **Agrégation puissante** : Pipeline d'agrégation flexible pour les statistiques de recettes, comparable aux GROUP BY SQL mais plus expressif.

5. **Scalabilité horizontale** : Facile à scaler avec sharding si le volume augmente. En SQL, le scaling vertical est souvent la seule option.

6. **Documents auto-contenus** : Les données liées (artistes d'un événement) peuvent être embarquées, réduisant le nombre de jointures nécessaires.

 8.2 Limites par rapport au relationnel

1. **Pas de jointures natives** : Utilisation de `$lookup` qui est moins performant que les JOIN SQL, surtout pour les gros volumes de données.

2. **Transactions limitées** : Les transactions multi-documents existent mais sont plus complexes à mettre en œuvre qu'en SQL.

3. **Schéma dynamique** : Risque d'incohérence si mal géré. En SQL, le schéma strict garantit la cohérence des données.

4. **Moins mature** : MongoDB est plus jeune que les SGBDR, donc moins d'outils et d'expertise disponibles.

 8.3 Quand choisir MongoDB vs SQL

**MongoDB est préféré quand :**
- Le schéma des données évolue fréquemment
- Les données sont hiérarchiques ou imbriquées
- On a besoin de scalabilité horizontale
- Les requêtes sont simples (CRUD)
- On a besoin de fonctionnalités spécifiques (TTL, géospatial, text search)

**SQL est préféré quand :**
- Les données sont fortement structurées et relationnelles
- L'intégrité des données est critique
- Les requêtes sont complexes avec beaucoup de jointures
- On a besoin de transactions ACID strictes
- L'équipe a une expertise SQL

---

 9. Difficultés rencontrées

 9.1 Gestion de la concurrence

**Problème :** Comment garantir qu'on ne vende jamais plus de places que la capacité de l'événement, même avec des requêtes concurrentes ?

**Solution :** Utilisation d'une mise à jour atomique avec condition :

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

Cette approche garantit l'atomicité sans avoir besoin de transactions complexes.

 9.2 Expiration TTL et restitution des places

**Problème :** L'index TTL supprime les réservations expirées, mais ne réincrémente pas automatiquement les places disponibles.

**Solution :** Implémentation d'un worker qui surveille les réservations expirées et réincrémente les places :

```javascript
setInterval(async () => {
  const dixMinutesAvant = new Date(Date.now() - 10 * 60 * 1000);
  
  const reservationsExpirees = await Reservation.find({
    statut: "EN_ATTENTE",
    date_creation: { $lt: dixMinutesAvant }
  });

  for (const res of reservationsExpirees) {
    await Evenement.findByIdAndUpdate(res.evenement_id, {
      $inc: { places_disponibles: res.nombre_places }
    });
    
    res.statut = "EXPIREE";
    await res.save();
  }
}, 60000);
```

 9.3 Structure du résultat explain()

**Problème :** La structure du résultat `explain()` varie selon la version de MongoDB, rendant difficile l'analyse automatisée.

**Solution :** Adaptation du script pour gérer différentes structures et afficher les informations essentielles (documents examinés, temps d'exécution).

 9.4 Index dupliqués

**Problème :** Erreur lors de la création des index due à des index déjà existants avec le même nom.

**Solution :** Gestion des erreurs dans le script de création des index pour ignorer les index déjà existants.

---

 10. Conclusion

Ce projet nous a permis de mettre en pratique l'ensemble des notions étudiées dans le module "Bases de données NoSQL". Nous avons conçu et réalisé une solution complète pour une plateforme de billetterie événementielle, en mettant particulièrement en valeur l'index TTL pour l'expiration automatique des réservations.

 10.1 Points forts du projet

- **Modélisation pertinente** : Choix justifiés entre embedding et referencing selon les patterns d'accès
- **Indexation optimisée** : 5 index créés avec justification, dont un index TTL et un index composé
- **Gestion de la concurrence** : Solution élégante utilisant les mises à jour atomiques
- **Pipeline d'agrégation** : Implémentation complète pour le calcul des recettes par événement
- **API REST fonctionnelle** : Endpoints CRUD avec filtres, pagination et recherche textuelle
- **Données réalistes** : Données de test ancrées dans le contexte gabonais

 10.2 Apprentissages

- Compréhension approfondie du modèle de données documentaire
- Maîtrise des opérations CRUD et des requêtes avancées MongoDB
- Expérience pratique avec l'indexation et l'optimisation des performances
- Utilisation de l'index TTL pour l'expiration automatique des données
- Comparaison concrète entre SQL et NoSQL

 10.3 Perspectives

Pour améliorer ce projet, nous pourrions :

- Ajouter l'authentification JWT pour sécuriser l'API
- Implémenter Redis pour le cache des places disponibles en temps réel
- Ajouter des tests unitaires et d'intégration
- Déployer l'application sur un VPS avec PM2 et Nginx
- Ajouter une interface utilisateur plus complète
- Implémenter un système de notifications en temps réel

 10.4 Conclusion générale

Ce projet a été une expérience enrichissante qui nous a permis de comprendre les forces et les limites de MongoDB par rapport aux bases de données relationnelles. Le focus sur l'index TTL nous a permis d'explorer une fonctionnalité spécifique de MongoDB qui n'a pas d'équivalent direct dans le monde relationnel.

La gestion de la concurrence et l'expiration automatique des réservations sont des problèmes concrets que nous avons pu résoudre de manière élégante grâce aux fonctionnalités de MongoDB. Ce projet nous a également sensibilisés à l'importance d'une bonne modélisation des données et d'une indexation réfléchie pour garantir des performances optimales.

---

 Annexes

 Annexe A : Structure du projet

```
billetterie-nosql/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── evenementController.js
│   │   └── reservationController.js
│   ├── models/
│   │   ├── Billet.js
│   │   ├── Evenement.js
│   │   ├── Reservation.js
│   │   └── Utilisateur.js
│   ├── routes/
│   │   ├── evenementRoutes.js
│   │   └── reservationRoutes.js
│   ├── scripts/
│   │   ├── createIndexes.js
│   │   ├── explainAnalysis.js
│   │   └── explainAfterIndexes.js
│   ├── workers/
│   │   └── ttlWorker.js
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── admin.html
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── docs/
│   ├── conception.md
│   ├── explain_analysis.md
│   └── rapport.md
├── postman_collection.json
└── README.md
```

 Annexe B : Commandes utiles

```bash
 Installer les dépendances
cd backend
npm install

 Peupler la base de données
node seed.js

 Créer les index
node scripts/createIndexes.js

 Analyse avant indexation
node scripts/explainAnalysis.js

 Analyse après indexation
node scripts/explainAfterIndexes.js

 Lancer le serveur
npm start

 Lancer en mode développement
npm run dev
```

 Annexe C : Références

- Documentation MongoDB : https://docs.mongodb.com/
- Documentation Mongoose : https://mongoosejs.com/docs/
- MongoDB Atlas : https://www.mongodb.com/cloud/atlas
- Cahier des charges du projet

---

**Fin du rapport**
