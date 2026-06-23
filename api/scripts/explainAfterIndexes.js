require("dotenv").config();
const mongoose = require("mongoose");
const Evenement = require("../models/Evenement");
const Utilisateur = require("../models/Utilisateur");

const runExplainAfterIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB Atlas\n");

    // ============================================
    // TEST 1 : Recherche par lieu (AVEC index sur lieu via index composé)
    // ============================================
    console.log("=== TEST 1 : Recherche par lieu 'Libreville' ===");
    console.log("APRÈS index composé (date, lieu) :");
    
    const explain1 = await Evenement.find({ lieu: "Libreville" })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain1.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain1.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain1.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    // ============================================
    // TEST 2 : Recherche par prix (AVEC index sur prix)
    // ============================================
    console.log("=== TEST 2 : Recherche par prix <= 15000 ===");
    console.log("APRÈS index sur prix :");
    
    const explain2 = await Evenement.find({ prix: { $lte: 15000 } })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain2.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain2.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain2.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    // ============================================
    // TEST 3 : Recherche composée date + lieu (AVEC index composé)
    // ============================================
    console.log("=== TEST 3 : Recherche composée date + lieu ===");
    console.log("APRÈS index composé (date, lieu) :");
    
    const explain3 = await Evenement.find({
      lieu: "Libreville",
      date: { $gte: new Date("2026-01-01") }
    })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain3.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain3.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain3.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    // ============================================
    // TEST 4 : Recherche par email (AVEC index sur email)
    // ============================================
    console.log("=== TEST 4 : Recherche par email ===");
    console.log("APRÈS index sur email :");
    
    const explain4 = await Utilisateur.findOne({ email: /jude\.ndong@gmail\.com/i })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain4.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain4.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain4.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    console.log("=== ANALYSE DES RÉSULTATS ===");
    console.log("Comparez les résultats avec ceux obtenus avant la création des index.");
    console.log("Vous devriez observer :");
    console.log("- Réduction du nombre de documents examinés");
    console.log("- Amélioration du temps d'exécution");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error.message);
    process.exit(1);
  }
};

runExplainAfterIndexes();
