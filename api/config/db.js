const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("⏳ Tentative de connexion à MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Atlas connecté avec succès !");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :");
    console.error("  Message:", error.message);
    console.error("  Nom de l'erreur:", error.name);
    if (error.reason) {
      console.error("  Raison:", error.reason);
    }
    console.error("\n💡 Vérifiez :");
    console.error("   1. Votre IP est autorisée dans MongoDB Atlas");
    console.error("   2. Les identifiants dans .env sont corrects");
    console.error("   3. Le cluster MongoDB Atlas est démarré");
    process.exit(1);
  }
};

module.exports = connectDB;