// Script 04-index.js - Indexation et analyse des performances
// Usage: mongosh < scripts/04-index.js (ou load("scripts/04-index.js") dans mongosh)

print("=== CRÉATION DES INDEX ET ANALYSE DES PERFORMANCES ===\n");

// ==================== SUPPRESSION DES INDEX EXISTANTS ====================

print("--- Suppression des index existants (sauf _id) ---");
db.evenements.dropIndexes();
db.utilisateurs.dropIndexes();
db.reservations.dropIndexes();
print("Index supprimés.\n");

// ==================== EXPLAIN AVANT CRÉATION DES INDEX (COLLSCAN) ====================

print("=== ANALYSE AVANT CRÉATION DES INDEX (COLLSCAN) ===\n");

print("--- Requête 1: Événements par prix (sans index) ---");
const explainAvant1 = db.evenements.find(
  { prix: { $gte: 15000, $lte: 20000 } }
).explain("executionStats");
print(`Stage: ${explainAvant1.executionStats.executionStages[0].stage}`);
print(`Documents examinés: ${explainAvant1.executionStats.totalDocsExamined}`);
print(`Temps d'exécution: ${explainAvant1.executionStats.executionTimeMillis}ms`);
print(`Winning plan: ${explainAvant1.queryPlanner.winningPlan.stage}\n`);

print("--- Requête 2: Événements par lieu (sans index) ---");
const explainAvant2 = db.evenements.find(
  { lieu: { $regex: /Libreville/i } }
).explain("executionStats");
print(`Stage: ${explainAvant2.executionStats.executionStages[0].stage}`);
print(`Documents examinés: ${explainAvant2.executionStats.totalDocsExamined}`);
print(`Temps d'exécution: ${explainAvant2.executionStats.executionTimeMillis}ms`);
print(`Winning plan: ${explainAvant2.queryPlanner.winningPlan.stage}\n`);

print("--- Requête 3: Utilisateur par email (sans index) ---");
const explainAvant3 = db.utilisateurs.find(
  { email: "jude@eventpass.com" }
).explain("executionStats");
print(`Stage: ${explainAvant3.executionStats.executionStages[0].stage}`);
print(`Documents examinés: ${explainAvant3.executionStats.totalDocsExamined}`);
print(`Temps d'exécution: ${explainAvant3.executionStats.executionTimeMillis}ms`);
print(`Winning plan: ${explainAvant3.queryPlanner.winningPlan.stage}\n`);

// ==================== CRÉATION DES INDEX ====================

print("=== CRÉATION DES INDEX ===\n");

print("--- Index 1: Index composé sur date et lieu (Evenement) ---");
db.evenements.createIndex(
  { date: 1, lieu: 1 },
  { name: "idx_date_lieu" }
);
print("Index 'idx_date_lieu' créé sur evenements.\n");

print("--- Index 2: Index sur prix (Evenement) ---");
db.evenements.createIndex(
  { prix: 1 },
  { name: "idx_prix" }
);
print("Index 'idx_prix' créé sur evenements.\n");

print("--- Index 3: Index text sur titre et description (Evenement) ---");
db.evenements.createIndex(
  { titre: "text", description: "text" },
  { name: "idx_text_search" }
);
print("Index 'idx_text_search' créé sur evenements.\n");

print("--- Index 4: Index sur email (Utilisateur) ---");
db.utilisateurs.createIndex(
  { email: 1 },
  { name: "idx_email" }
);
print("Index 'idx_email' créé sur utilisateurs.\n");

print("--- Index 5: Index TTL sur date_creation (Reservation) - FOCUS NOSQL ---");
db.reservations.createIndex(
  { date_creation: 1 },
  {
    name: "idx_ttl_reservation",
    expireAfterSeconds: 600,
    partialFilterExpression: { statut: "EN_ATTENTE" }
  }
);
print("Index TTL 'idx_ttl_reservation' créé sur reservations (expire après 10 min si statut=EN_ATTENTE).\n");

print("--- Index 6: Index sur utilisateur_id (Reservation) ---");
db.reservations.createIndex(
  { utilisateur_id: 1 },
  { name: "idx_utilisateur_id" }
);
print("Index 'idx_utilisateur_id' créé sur reservations.\n");

print("--- Index 7: Index sur evenement_id (Reservation) ---");
db.reservations.createIndex(
  { evenement_id: 1 },
  { name: "idx_evenement_id" }
);
print("Index 'idx_evenement_id' créé sur reservations.\n");

// ==================== LISTE DES INDEX CRÉÉS ====================

print("=== LISTE DES INDEX CRÉÉS ===\n");

print("--- Index sur evenements ---");
db.evenements.getIndexes().forEach(idx => {
  print(`  Nom: ${idx.name}`);
  print(`  Clés: ${JSON.stringify(idx.key)}`);
  print("");
});

print("--- Index sur utilisateurs ---");
db.utilisateurs.getIndexes().forEach(idx => {
  print(`  Nom: ${idx.name}`);
  print(`  Clés: ${JSON.stringify(idx.key)}`);
  print("");
});

print("--- Index sur reservations ---");
db.reservations.getIndexes().forEach(idx => {
  print(`  Nom: ${idx.name}`);
  print(`  Clés: ${JSON.stringify(idx.key)}`);
  if (idx.expireAfterSeconds) {
    print(`  TTL: expire après ${idx.expireAfterSeconds} secondes`);
  }
  print("");
});

// ==================== EXPLAIN APRÈS CRÉATION DES INDEX (IXSCAN) ====================

print("=== ANALYSE APRÈS CRÉATION DES INDEX (IXSCAN) ===\n");

print("--- Requête 1: Événements par prix (avec index) ---");
const explainApres1 = db.evenements.find(
  { prix: { $gte: 15000, $lte: 20000 } }
).explain("executionStats");
print(`Stage: ${explainApres1.executionStats.executionStages[0].stage}`);
print(`Documents examinés: ${explainApres1.executionStats.totalDocsExamined}`);
print(`Temps d'exécution: ${explainApres1.executionStats.executionTimeMillis}ms`);
print(`Index utilisé: ${explainApres1.queryPlanner.winningPlan.inputStage.indexName}`);
print(`Winning plan: ${explainApres1.queryPlanner.winningPlan.stage}\n`);

print("--- Requête 2: Événements par date et lieu (avec index composé) ---");
const explainApres2 = db.evenements.find(
  { date: { $gte: new Date("2026-07-01") }, lieu: "Libreville" }
).explain("executionStats");
print(`Stage: ${explainApres2.executionStats.executionStages[0].stage}`);
print(`Documents examinés: ${explainApres2.executionStats.totalDocsExamined}`);
print(`Temps d'exécution: ${explainApres2.executionStats.executionTimeMillis}ms`);
print(`Index utilisé: ${explainApres2.queryPlanner.winningPlan.inputStage.indexName}`);
print(`Winning plan: ${explainApres2.queryPlanner.winningPlan.stage}\n`);

print("--- Requête 3: Utilisateur par email (avec index) ---");
const explainApres3 = db.utilisateurs.find(
  { email: "jude@eventpass.com" }
).explain("executionStats");
print(`Stage: ${explainApres3.executionStats.executionStages[0].stage}`);
print(`Documents examinés: ${explainApres3.executionStats.totalDocsExamined}`);
print(`Temps d'exécution: ${explainApres3.executionStats.executionTimeMillis}ms`);
print(`Index utilisé: ${explainApres3.queryPlanner.winningPlan.inputStage.indexName}`);
print(`Winning plan: ${explainApres3.queryPlanner.winningPlan.stage}\n`);

// ==================== COMPARAISON AVANT/APRÈS ====================

print("=== RÉSUMÉ DE LA COMPARAISON ===\n");

print("Requête 1 (Événements par prix):");
print(`  Avant: COLLSCAN, ${explainAvant1.executionStats.totalDocsExamined} docs, ${explainAvant1.executionStats.executionTimeMillis}ms`);
print(`  Après: IXSCAN, ${explainApres1.executionStats.totalDocsExamined} docs, ${explainApres1.executionStats.executionTimeMillis}ms`);
print(`  Gain: ${explainAvant1.executionStats.totalDocsExamined - explainApres1.executionStats.totalDocsExamined} documents examinés en moins\n`);

print("Requête 2 (Événements par date et lieu):");
print(`  Avant: COLLSCAN, ${explainAvant2.executionStats.totalDocsExamined} docs, ${explainAvant2.executionStats.executionTimeMillis}ms`);
print(`  Après: IXSCAN, ${explainApres2.executionStats.totalDocsExamined} docs, ${explainApres2.executionStats.executionTimeMillis}ms`);
print(`  Gain: ${explainAvant2.executionStats.totalDocsExamined - explainApres2.executionStats.totalDocsExamined} documents examinés en moins\n`);

print("Requête 3 (Utilisateur par email):");
print(`  Avant: COLLSCAN, ${explainAvant3.executionStats.totalDocsExamined} docs, ${explainAvant3.executionStats.executionTimeMillis}ms`);
print(`  Après: IXSCAN, ${explainApres3.executionStats.totalDocsExamined} docs, ${explainApres3.executionStats.executionTimeMillis}ms`);
print(`  Gain: ${explainAvant3.executionStats.totalDocsExamined - explainApres3.executionStats.totalDocsExamined} documents examinés en moins\n`);

print("=== FIN DE L'ANALYSE D'INDEXATION ===");
