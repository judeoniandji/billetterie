require("dotenv").config();
const mongoose = require("mongoose");
const Utilisateur = require("./models/Utilisateur");

const cleanIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    console.log("\nSuppression de l'ancien index email...");
    await Utilisateur.collection.dropIndex("email_1").catch(err => {
      console.log("Index email_1 n'existe pas, c'est okay!");
    });

    console.log("\n✅ Index nettoyés !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

cleanIndexes();
