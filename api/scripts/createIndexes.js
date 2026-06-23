require("dotenv").config();
const mongoose = require("mongoose");

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB Atlas\n");

    // Création des index sur tous les modèles
    console.log("=== CRÉATION DES INDEX ===\n");

    // Index Evenement
    const Evenement = require("../models/Evenement");
    await Evenement.createIndexes();
    console.log("✅ Index Evenement créés :");
    console.log("   - Index composé (date: 1, lieu: 1)");
    console.log("   - Index sur prix (prix: 1)");
    console.log("   - Index text (titre: text, description: text)");
    console.log("");

    // Index Utilisateur (avec gestion d'erreur si l'index existe déjà)
    const Utilisateur = require("../models/Utilisateur");
    try {
      await Utilisateur.createIndexes();
      console.log("✅ Index Utilisateur créés :");
      console.log("   - Index sur email (email: 1)");
    } catch (err) {
      if (err.message.includes("An existing index has the same name")) {
        console.log("⚠️  Index Utilisateur déjà existants (email: 1)");
      } else {
        throw err;
      }
    }
    console.log("");

    // Index Reservation
    const Reservation = require("../models/Reservation");
    await Reservation.createIndexes();
    console.log("✅ Index Reservation créés :");
    console.log("   - Index TTL (date_creation: 1, expireAfterSeconds: 600, partialFilterExpression: {statut: 'EN_ATTENTE'})");
    console.log("");

    console.log("=== TOUS LES INDEX ONT ÉTÉ CRÉÉS AVEC SUCCÈS ===\n");

    // Afficher la liste des index
    console.log("=== LISTE DES INDEX PAR COLLECTION ===\n");
    
    const evenementIndexes = await Evenement.collection.getIndexes();
    console.log("Collection 'evenements':");
    Object.keys(evenementIndexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(evenementIndexes[indexName].key));
    });
    console.log("");

    const utilisateurIndexes = await Utilisateur.collection.getIndexes();
    console.log("Collection 'utilisateurs':");
    Object.keys(utilisateurIndexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(utilisateurIndexes[indexName].key));
    });
    console.log("");

    const reservationIndexes = await Reservation.collection.getIndexes();
    console.log("Collection 'reservations':");
    Object.keys(reservationIndexes).forEach(indexName => {
      console.log(`  - ${indexName}:`, JSON.stringify(reservationIndexes[indexName].key));
    });
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la création des index:", error.message);
    process.exit(1);
  }
};

createIndexes();
