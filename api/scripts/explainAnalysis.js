require("dotenv").config();
const mongoose = require("mongoose");
const Evenement = require("../models/Evenement");
const Utilisateur = require("../models/Utilisateur");

const runExplainAnalysis = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB Atlas\n");

    // ============================================
    // TEST 1 : Recherche par lieu (SANS index sur lieu)
    // ============================================
    console.log("=== TEST 1 : Recherche par lieu 'Libreville' ===");
    console.log("Avant index sur lieu :");
    
    const explain1 = await Evenement.find({ lieu: "Libreville" })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain1.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain1.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain1.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    // ============================================
    // TEST 2 : Recherche par prix (SANS index sur prix)
    // ============================================
    console.log("=== TEST 2 : Recherche par prix <= 15000 ===");
    console.log("Avant index sur prix :");
    
    const explain2 = await Evenement.find({ prix: { $lte: 15000 } })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain2.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain2.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain2.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    // ============================================
    // TEST 3 : Recherche composée date + lieu (SANS index composé)
    // ============================================
    console.log("=== TEST 3 : Recherche composée date + lieu ===");
    console.log("Avant index composé (date, lieu) :");
    
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
    // TEST 4 : Recherche par email (SANS index sur email)
    // ============================================
    console.log("=== TEST 4 : Recherche par email ===");
    console.log("Avant index sur email :");
    
    const explain4 = await Utilisateur.find({ email: /jude\.ndong@gmail\.com/i })
      .explain("executionStats");
    
    console.log("Documents examinés:", explain4.executionStats.totalDocsExamined);
    console.log("Temps d'exécution (ms):", explain4.executionStats.executionTimeMillis);
    console.log("WinningPlan:", JSON.stringify(explain4.executionStats.executionStages, null, 2).substring(0, 200) + "...");
    console.log("");

    console.log("=== CRÉATION DES INDEX ===");
    console.log("Les index sont déjà définis dans les modèles Mongoose.");
    console.log("Pour appliquer les index, exécutez: node scripts/createIndexes.js");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error.message);
    process.exit(1);
  }
};

runExplainAnalysis();
