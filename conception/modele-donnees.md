 Dossier de Conception - Plateforme de Billetterie Événementielle

**Groupe 9 :** ONIANDJI Jude, BOUALA NUKAFO Kingsy Jones, 
**Module :** Bases de données NoSQL - Master I - Année Académique 2025-2026

-

 1. Contexte du projet

Une plateforme de vente de billets pour concerts et événements à Libreville. Les utilisateurs réservent des places ; le paiement doit être confirmé sous dix minutes, sinon la réservation expire et les places sont relibérées.

**Focus NoSQL :** Index TTL et expiration automatique. Exploitation d'un index TTL pour faire expirer automatiquement les réservations non payées, et discussion du rôle de Redis pour les sessions.

---

 2. Modèle de données

 2.1 Collections principales

1. **utilisateurs** - Informations sur les utilisateurs
2. **evenements** - Informations sur les concerts et événements
3. **reservations** - Réservations des utilisateurs (avec TTL)
4. **billets** - Billets générés après paiement


 3. Structure des collections

 3.1 Collection `utilisateurs`

```javascript
{
  _id: ObjectId,
  nom: String (required),
  prenom: String (required),
  email: String (required, unique),
  telephone: String (required, match: /^(?:\+241|0)[1-7][0-9]{6,7}$/),
  ville: String (enum: ["Libreville", "Port-Gentil", "Franceville", "Owendo", "Akanda"]),
  role: String (enum: ["client", "admin"], default: "client"),
  createdAt: Date,
  updatedAt: Date
}
```

**Index :**
- `{ email: 1 }` - Pour l'authentification

---

# 3.2 Collection `evenements`

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

**Index :**
- `{ date: 1, lieu: 1 }` - Index composé pour les recherches par date et lieu
- `{ prix: 1 }` - Pour les filtres par prix
- `{ titre: "text", description: "text" }` - Index text pour la recherche plein texte

---

# 3.3 Collection `reservations`

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

**Index :**
- `{ date_creation: 1 }` avec `expireAfterSeconds: 600` et `partialFilterExpression: { statut: "EN_ATTENTE" }` - Index TTL pour expiration automatique

---

# 3.4 Collection `billets`

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

---

 4. Justification des choix Embedding vs Referencing

# 4.1 Réservation : Referencing

**Choix :** Référencement (Referencing) pour `utilisateur_id` et `evenement_id`

**Justification :**

1. **Indépendance des données** : Les informations de l'utilisateur (email, téléphone) et de l'événement (prix, date) peuvent évoluer indépendamment de la réservation. Une réservation n'est qu'un "lien" temporaire entre un utilisateur et un événement.

2. **Éviter la redondance** : Si nous embarquions (embed) les informations de l'utilisateur et de l'événement dans chaque réservation, une modification de l'email de l'utilisateur nécessiterait de mettre à jour toutes ses réservations.

3. **Taille des documents** : Les documents de réservation restent légers, ce qui améliore les performances des requêtes.

4. **Flexibilité** : Le référencement permet de récupérer les informations à jour via `$lookup` lors des agrégations.

**Alternative non retenue :** Embedding aurait été envisageable si les informations de l'utilisateur et de l'événement étaient immuables au moment de la réservation (pour conserver un historique exact).

---

# 4.2 Événement - Artistes : Embedding

**Choix :** Imbrication (Embedding) pour `artistes`

**Justification :**

1. **Cardinalité faible** : Un événement a généralement un nombre limité d'artistes (1-10), ce qui respecte la limite de 16 Mo de MongoDB.

2. **Cohésion des données** : Les artistes sont intrinsèquement liés à l'événement. Ils sont toujours affichés ensemble.

3. **Performance** : Une seule lecture suffit pour récupérer l'événement et ses artistes, sans jointure.

4. **Stabilité** : La liste des artistes d'un événement change rarement après sa création.

**Alternative non retenue :** Referencing aurait nécessité une collection `artistes` et des jointures systématiques, alourdissant les requêtes.

---

# 4.3 Billet : Referencing

**Choix :** Référencement (Referencing) pour `reservation_id`, `evenement_id`, `utilisateur_id`

**Justification :**

1. **Traçabilité** : Chaque billet doit pouvoir être relié à sa réservation d'origine, à l'événement et à l'utilisateur pour le contrôle d'accès.

2. **Flexibilité** : Un billet peut changer de statut (VALIDE → UTILISE) indépendamment de la réservation.

3. **Agrégations** : Les références permettent de calculer des statistiques (billets par événement, billets par utilisateur) via `$lookup`.

4. **Taille** : Les documents de billet restent légers avec seulement des références ObjectId.

---

# 4.4 Utilisateur : Pas d'embedding des réservations

**Choix :** Pas d'embedding des réservations dans l'utilisateur

**Justification :**

1. **Cardinalité élevée** : Un utilisateur peut avoir des dizaines ou centaines de réservations, ce qui pourrait dépasser la limite de 16 Mo.

2. **Dynamique** : Les réservations sont créées et modifiées fréquemment.

3. **Performance** : L'embedding ralentirait les mises à jour de l'utilisateur.

4. **Filtrage** : Le référencement permet de filtrer les réservations par statut, date, etc.

**Alternative non retenue :** Embedding aurait été possible avec une limite de réservations embarquées (ex: les 10 dernières) pour un affichage rapide, mais cela aurait ajouté de la complexité.

---

 5. Focus NoSQL - Index TTL

# 5.1 Principe de l'index TTL

L'index TTL (Time-To-Live) de MongoDB permet de supprimer automatiquement des documents après un certain délai.

**Implémentation dans notre projet :**

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

---

# 5.2 Worker TTL pour restitution des places

L'index TTL supprime les réservations expirées, mais ne réincrémente pas automatiquement les places disponibles. Pour cela, nous avons implémenté un worker (`ttlWorker.js`) qui :

1. Surveille les réservations en attente vieilles de plus de 10 minutes
2. Réincrémente les places disponibles dans l'événement correspondant
3. Passe le statut de la réservation à "EXPIREE"

**Code du worker :**

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

---

# 5.3 Rôle de Redis pour les sessions (vu en théorie)

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

 6. Gestion de la concurrence

# 6.1 Problème

Le défi technique est de garantir qu'on ne vende jamais plus de places que la capacité de l'événement, même avec des requêtes concurrentes.

# 6.2 Solution : Mise à jour atomique avec condition

Au lieu de lire la capacité puis d'écrire (ce qui crée une "race condition"), nous utilisons une mise à jour atomique :

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

**Avantages :**
- Atomicité garantie par MongoDB
- Pas de race condition
- Pas besoin de transactions complexes

---

 7. Pipeline d'agrégation - Recettes par événement

```javascript
Reservation.aggregate([
  { $match: { statut: "CONFIRMEE" } },
  { 
    $group: {
      _id: "$evenement_id",
      recettes_totales: { $sum: "$montant_total" },
      billets_vendus: { $sum: "$nombre_places" }
    }
  },
  {
    $lookup: {
      from: "evenements",
      localField: "_id",
      foreignField: "_id",
      as: "details_evenement"
    }
  },
  { $unwind: "$details_evenement" },
  {
    $project: {
      _id: 0,
      id_evenement: "$_id",
      titre: "$details_evenement.titre",
      recettes_FCFA: "$recettes_totales",
      billets_vendus: "$billets_vendus"
    }
  },
  { $sort: { recettes_FCFA: -1 } }
])
```

**Étapes :**
1. `$match` : Filtre les réservations confirmées
2. `$group` : Groupe par événement et calcule les totaux
3. `$lookup` : Jointure avec la collection evenements
4. `$unwind` : Déconstruit le tableau résultant
5. `$project` : Projette les champs à retourner
6. `$sort` : Trie par recettes décroissantes

---

 8. Indexation et performance

# 8.1 Index créés

| Collection | Index | Justification |
|------------|-------|--------------|
| evenements | `{ date: 1, lieu: 1 }` | Optimise les recherches par date et lieu combinées |
| evenements | `{ prix: 1 }` | Optimise les filtres par fourchette de prix |
| evenements | `{ titre: "text", description: "text" }` | Permet la recherche plein texte sémantique |
| utilisateurs | `{ email: 1 }` | Optimise l'authentification par email |
| reservations | `{ date_creation: 1 }` (TTL) | Supprime automatiquement les réservations non payées après 10 min |

# 8.2 Analyse explain()

**Avant indexation :**
- Stage : COLLSCAN (scan complet de la collection)
- Documents examinés : Tous les documents de la collection
- Temps d'exécution : Élevé

**Après indexation :**
- Stage : IXSCAN (scan d'index)
- Documents examinés : Seulement les documents correspondants
- Temps d'exécution : Réduit significativement

---

 9. Données de test

Les données de test sont ancrées dans le contexte gabonais :
- **Noms** : Ndong, Moussavou, Mba, Obame, Biyoghe, Ngoma, Koumba, Nziengui, Nzoghe, Essono
- **Prénoms** : Jude, Alain, Chancia, Marc, Sylvie, Kevin, Grace, Hervé, Léa, Paul
- **Villes** : Libreville, Port-Gentil, Franceville, Owendo, Akanda
- **Lieux** : Stade de l'Amitié, Institut Français, Palais des Sports, Casino Croisette
- **Prix** : En FCFA (5000, 10000, 15000, etc.)
- **Téléphones** : Format +241 ou 06x/07x

---

 10. Conclusion

Ce modèle de données NoSQL a été conçu pour répondre aux besoins spécifiques d'une plateforme de billetterie événementielle, en mettant particulièrement en valeur l'index TTL pour l'expiration automatique des réservations. Les choix entre embedding et referencing ont été justifiés en fonction des patterns d'accès et des contraintes de performance.
