// Script 01-crud.js - Opérations CRUD
// Usage: mongosh < scripts/01-crud.js (ou load("scripts/01-crud.js") dans mongosh)

print("=== DÉMONSTRATION DES OPÉRATIONS CRUD ===\n");

// ==================== CREATE (INSERTION) ====================

print("--- CREATE: insertOne ---");
const nouvelUtilisateur = {
  nom: "Moussavou",
  prenom: "Patrick",
  email: "patrick.moussavou@gmail.com",
  telephone: "+241762233445",
  ville: "Libreville",
  role: "user"
};
const resultInsertOne = db.utilisateurs.insertOne(nouvelUtilisateur);
print(`Utilisateur inséré avec _id: ${resultInsertOne.insertedId}\n`);

print("--- CREATE: insertMany ---");
const nouveauxEvenements = [
  {
    titre: "Concert de Bana C4",
    description: "Le chanteur congolais en concert à Libreville",
    date: new Date("2026-07-15"),
    lieu: "Stade de l'Amitié, Akanda",
    prix: 15000,
    capacite_totale: 3000,
    places_disponibles: 3000,
    image: "https://images.unsplash.com/photo-1540039155732-61ee0150937c?auto=format&fit=crop&w=800&q=80"
  },
  {
    titre: "Festival Jazz de Libreville",
    description: "3 jours de jazz international",
    date: new Date("2026-08-20"),
    lieu: "Institut Français, Libreville",
    prix: 25000,
    capacite_totale: 500,
    places_disponibles: 500,
    image: "https://images.unsplash.com/photo-1470229722913-7c090be5c520?auto=format&fit=crop&w=800&q=80"
  }
];
const resultInsertMany = db.evenements.insertMany(nouveauxEvenements);
print(`${resultInsertMany.length} événements insérés\n`);

// ==================== READ (LECTURE) ====================

print("--- READ: find avec filtres ---");
const utilisateursLibreville = db.utilisateurs.find(
  { ville: "Libreville" },
  { nom: 1, prenom: 1, email: 1, _id: 0 }
).limit(5);
print("Utilisateurs de Libreville (projection nom, prenom, email):");
utilisateursLibreville.forEach(u => print(`  - ${u.prenom} ${u.nom} (${u.email})`));
print("");

print("--- READ: find avec opérateur $gt ---");
const evenementsChers = db.evenements.find(
  { prix: { $gt: 20000 } },
  { titre: 1, prix: 1, lieu: 1, _id: 0 }
);
print("Événements avec prix > 20000 FCFA:");
evenementsChers.forEach(e => print(`  - ${e.titre}: ${e.prix} FCFA à ${e.lieu}`));
print("");

print("--- READ: find avec regex ---");
const evenementsConcert = db.evenements.find(
  { titre: { $regex: /concert/i } },
  { titre: 1, date: 1, _id: 0 }
);
print("Événements contenant 'concert' dans le titre:");
evenementsConcert.forEach(e => print(`  - ${e.titre} (${e.date.toISOString().split('T')[0]})`));
print("");

// ==================== UPDATE (MISE À JOUR) ====================

print("--- UPDATE: updateOne avec $set ---");
const resultUpdateSet = db.utilisateurs.updateOne(
  { email: "patrick.moussavou@gmail.com" },
  { $set: { ville: "Port-Gentil" } }
);
print(`Utilisateur mis à jour: ${resultUpdateSet.modifiedCount} document modifié\n`);

print("--- UPDATE: updateOne avec $inc ---");
const resultUpdateInc = db.evenements.updateOne(
  { titre: "Concert de Bana C4" },
  { $inc: { places_disponibles: -5 } }
);
print(`Places disponibles décrémentées de 5: ${resultUpdateInc.modifiedCount} document modifié\n`);

print("--- UPDATE: updateMany avec $set ---");
const resultUpdateMany = db.reservations.updateMany(
  { statut: "EN_ATTENTE", date_creation: { $lt: new Date(Date.now() - 15 * 60 * 1000) } },
  { $set: { statut: "EXPIREE" } }
);
print(`Réservations expirées (15+ min): ${resultUpdateMany.modifiedCount} documents modifiés\n`);

print("--- UPDATE: $push (ajout dans tableau) ---");
const resultPush = db.evenements.updateOne(
  { titre: "Concert de Bana C4" },
  { $push: { artistes: { nom: "Bana C4", heure_passage: "21h00" } } }
);
print(`Artiste ajouté à l'événement: ${resultPush.modifiedCount} document modifié\n`);

// ==================== DELETE (SUPPRESSION) ====================

print("--- DELETE: deleteOne ---");
const resultDeleteOne = db.utilisateurs.deleteOne(
  { email: "patrick.moussavou@gmail.com" }
);
print(`Utilisateur supprimé: ${resultDeleteOne.deletedCount} document supprimé\n`);

print("--- DELETE: deleteMany ---");
const resultDeleteMany = db.reservations.deleteMany(
  { statut: "EXPIREE" }
);
print(`Réservations expirées supprimées: ${resultDeleteMany.deletedCount} documents supprimés\n`);

print("=== FIN DES OPÉRATIONS CRUD ===");
