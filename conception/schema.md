# Schéma du modèle de données - Plateforme de Billetterie

## Représentation Mermaid (à convertir en image)

```mermaid
erDiagram
    UTILISATEUR ||--o{ RESERVATION : effectue
    EVENEMENT ||--o{ RESERVATION : concerne
    RESERVATION ||--o{ BILLET : génère
    EVENEMENT ||--o{ BILLET : correspond

    UTILISATEUR {
        ObjectId _id PK
        String nom
        String prenom
        String email UK
        String telephone
        String ville
        String role
        Date createdAt
        Date updatedAt
    }

    EVENEMENT {
        ObjectId _id PK
        String titre
        String description
        Date date
        String lieu
        Number prix
        Number capacite_totale
        Number places_disponibles
        String image
        Array artistes
        Date createdAt
        Date updatedAt
    }

    RESERVATION {
        ObjectId _id PK
        ObjectId utilisateur_id FK
        ObjectId evenement_id FK
        Number nombre_places
        String statut
        Number montant_total
        Date date_creation TTL
    }

    BILLET {
        ObjectId _id PK
        ObjectId reservation_id FK
        ObjectId evenement_id FK
        ObjectId utilisateur_id FK
        String code_barre UK
        String statut
        Date createdAt
        Date updatedAt
    }
```

## Représentation ASCII

```
┌─────────────────────────────────┐
│       UTILISATEUR               │
├─────────────────────────────────┤
│ _id: ObjectId (PK)              │
│ nom: String                     │
│ prenom: String                  │
│ email: String (Unique)          │
│ telephone: String               │
│ ville: String                   │
│ role: String                    │
│ createdAt: Date                 │
│ updatedAt: Date                 │
└───────────────┬─────────────────┘
                │
                │ 1
                │
                │ *
        ┌───────▼─────────────────────┐
        │      RESERVATION           │
        ├─────────────────────────────┤
        │ _id: ObjectId (PK)          │
        │ utilisateur_id: ObjectId (FK)│
        │ evenement_id: ObjectId (FK) │
        │ nombre_places: Number       │
        │ statut: String              │
        │ montant_total: Number        │
        │ date_creation: Date (TTL)   │
        └───────┬─────────────────────┘
                │
                │ *
                │
        ┌───────▼─────────────────────┐
        │         BILLET              │
        ├─────────────────────────────┤
        │ _id: ObjectId (PK)          │
        │ reservation_id: ObjectId (FK)│
        │ evenement_id: ObjectId (FK) │
        │ utilisateur_id: ObjectId (FK)│
        │ code_barre: String (Unique) │
        │ statut: String              │
        │ createdAt: Date              │
        │ updatedAt: Date              │
        └─────────────────────────────┘

┌─────────────────────────────────┐
│        EVENEMENT                 │
├─────────────────────────────────┤
│ _id: ObjectId (PK)              │
│ titre: String                   │
│ description: String              │
│ date: Date                      │
│ lieu: String                    │
│ prix: Number                    │
│ capacite_totale: Number         │
│ places_disponibles: Number      │
│ image: String                   │
│ artistes: Array                 │
│ createdAt: Date                 │
│ updatedAt: Date                 │
└───────────────┬─────────────────┘
                │
                │ 1
                │
                │ *
        ┌───────▼─────────────────────┐
        │      RESERVATION           │
        │ (déjà défini ci-dessus)    │
        └─────────────────────────────┘

                │
                │ 1
                │
                │ *
        ┌───────▼─────────────────────┐
        │         BILLET              │
        │ (déjà défini ci-dessus)    │
        └─────────────────────────────┘
```

## Instructions pour convertir en PNG

### Option 1: Mermaid Live Editor
1. Copiez le code Mermaid ci-dessus
2. Allez sur https://mermaid.live/
3. Collez le code dans l'éditeur
4. Exportez en PNG

### Option 2: Draw.io
1. Allez sur https://app.diagrams.net/
2. Créez un nouveau diagramme
3. Dessinez les 4 collections avec leurs champs
4. Ajoutez les relations (lignes)
5. Exportez en PNG

### Option 3: Excalidraw
1. Allez sur https://excalidraw.com/
2. Dessinez le schéma manuellement
3. Exportez en PNG

## Notes sur les relations

- **UTILISATEUR → RESERVATION** : Un utilisateur peut effectuer plusieurs réservations (1:N)
- **EVENEMENT → RESERVATION** : Un événement peut avoir plusieurs réservations (1:N)
- **RESERVATION → BILLET** : Une réservation génère plusieurs billets (1:N)
- **EVENEMENT → BILLET** : Un événement correspond à plusieurs billets (1:N)

## Index créés

- **utilisateurs** : `{ email: 1 }`
- **evenements** : `{ date: 1, lieu: 1 }`, `{ prix: 1 }`, `{ titre: "text", description: "text" }`
- **reservations** : `{ date_creation: 1 }` (TTL avec expireAfterSeconds: 600)
