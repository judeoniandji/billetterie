// Script 02-requetes.js - Requêtes avancées
// Usage: mongosh < scripts/02-requetes.js (ou load("scripts/02-requetes.js") dans mongosh)

print("=== DÉMONSTRATION DES REQUÊTES AVANCÉES ===\n");

// ==================== OPÉRATEURS DE COMPARAISON ====================

print("--- Opérateurs $gt, $lt, $gte, $lte ---");
const evenementsPrix = db.evenements.find(
  { prix: { $gte: 10000, $lte: 20000 } },
  { titre: 1, prix: 1, _id: 0 }
).sort({ prix: 1 });
print("Événements entre 10000 et 20000 FCFA (triés par prix):");
evenementsPrix.forEach(e => print(`  - ${e.titre}: ${e.prix} FCFA`));
print("");

print("--- Opérateur $in ---");
const evenementsVilles = db.evenements.find(
  { lieu: { $in: [/Libreville/i, /Akanda/i] } },
  { titre: 1, lieu: 1, _id: 0 }
).limit(5);
print("Événements à Libreville ou Akanda:");
evenementsVilles.forEach(e => print(`  - ${e.titre} à ${e.lieu}`));
print("");

// ==================== OPÉRATEURS LOGIQUES ====================

print("--- Opérateur $or ---");
const evenementsOr = db.evenements.find(
  {
    $or: [
      { prix: { $lt: 10000 } },
      { prix: { $gt: 50000 } }
    ]
  },
  { titre: 1, prix: 1, _id: 0 }
);
print("Événements avec prix < 10000 ou > 50000 FCFA:");
evenementsOr.forEach(e => print(`  - ${e.titre}: ${e.prix} FCFA`));
print("");

print("--- Opérateur $and ---");
const evenementsAnd = db.evenements.find(
  {
    $and: [
      { prix: { $gte: 15000 } },
      { places_disponibles: { $gte: 100 } }
    ]
  },
  { titre: 1, prix: 1, places_disponibles: 1, _id: 0 }
);
print("Événements avec prix >= 15000 ET places >= 100:");
evenementsAnd.forEach(e => print(`  - ${e.titre}: ${e.prix} FCFA (${e.places_disponibles} places)`));
print("");

// ==================== EXPRESSIONS RÉGULIÈRES (REGEX) ====================

print("--- Regex insensible à la casse ---");
const evenementsRegex = db.evenements.find(
  { titre: { $regex: /festival/i } },
  { titre: 1, lieu: 1, _id: 0 }
);
print("Événements contenant 'festival' (insensible à la casse):");
evenementsRegex.forEach(e => print(`  - ${e.titre} à ${e.lieu}`));
print("");

print("--- Regex avec ancrage ---");
const evenementsAncre = db.evenements.find(
  { titre: { $regex: /^Concert/i } },
  { titre: 1, _id: 0 }
).limit(5);
print("Événements commençant par 'Concert':");
evenementsAncre.forEach(e => print(`  - ${e.titre}`));
print("");

// ==================== OPÉRATEURS SUR TABLEAUX ====================

print("--- Opérateur $size (taille de tableau) ---");
const evenementsArtistes = db.evenements.find(
  { artistes: { $exists: true, $not: { $size: 0 } } },
  { titre: 1, artistes: 1, _id: 0 }
);
print("Événements avec des artistes (tableau non vide):");
evenementsArtistes.forEach(e => {
  print(`  - ${e.titre}:`);
  e.artistes.forEach(a => print(`    * ${a.nom} (${a.heure_passage})`));
});
print("");

// ==================== TRI (SORT) ====================

print("--- Tri par date croissante ---");
const evenementsTriDate = db.evenements.find(
  {},
  { titre: 1, date: 1, _id: 0 }
).sort({ date: 1 }).limit(5);
print("5 prochains événements (triés par date):");
evenementsTriDate.forEach(e => print(`  - ${e.titre} (${e.date.toISOString().split('T')[0]})`));
print("");

print("--- Tri par prix décroissant ---");
const evenementsTriPrix = db.evenements.find(
  {},
  { titre: 1, prix: 1, _id: 0 }
).sort({ prix: -1 }).limit(5);
print("5 événements les plus chers:");
evenementsTriPrix.forEach(e => print(`  - ${e.titre}: ${e.prix} FCFA`));
print("");

// ==================== PAGINATION (SKIP/LIMIT) ====================

print("--- Pagination: page 1 (5 résultats) ---");
const page1 = db.evenements.find(
  {},
  { titre: 1, lieu: 1, _id: 0 }
).sort({ titre: 1 }).skip(0).limit(5);
print("Page 1 des événements:");
page1.forEach(e => print(`  - ${e.titre} à ${e.lieu}`));
print("");

print("--- Pagination: page 2 (5 résultats) ---");
const page2 = db.evenements.find(
  {},
  { titre: 1, lieu: 1, _id: 0 }
).sort({ titre: 1 }).skip(5).limit(5);
print("Page 2 des événements:");
page2.forEach(e => print(`  - ${e.titre} à ${e.lieu}`));
print("");

// ==================== COMPTAGE ====================

print("--- Comptage total ---");
const totalEvenements = db.evenements.countDocuments({});
print(`Total d'événements: ${totalEvenements}\n`);

print("--- Comptage avec filtre ---");
const evenementsLibreville = db.evenements.countDocuments({ lieu: { $regex: /Libreville/i } });
print(`Événements à Libreville: ${evenementsLibreville}\n`);

print("--- Comptage avec condition complexe ---");
const evenementsDisponibles = db.evenements.countDocuments({
  places_disponibles: { $gte: 50 },
  prix: { $lte: 20000 }
});
print(`Événements disponibles (>= 50 places, <= 20000 FCFA): ${evenementsDisponibles}\n`);

// ==================== RECHERCHE TEXTE (INDEX TEXT) ====================

print("--- Recherche textuelle avec $text ---");
// Note: Nécessite un index text sur titre et description
try {
  const rechercheTexte = db.evenements.find(
    { $text: { $search: "musique concert gabon" } },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
  print("Résultats de recherche textuelle (musique, concert, gabon):");
  rechercheTexte.forEach(e => print(`  - ${e.titre} (score: ${e.score})`));
} catch (e) {
  print("Index text non créé. Exécutez d'abord scripts/04-index.js");
}
print("");

print("=== FIN DES REQUÊTES AVANCÉES ===");
