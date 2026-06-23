const mongoose = require("mongoose");

const utilisateurSchema = new mongoose.Schema(
  {
    nom: { type: String },
    prenom: { type: String },
    email: { type: String },
    telephone: { type: String, unique: true },
    ville: { type: String },
    role: { type: String, enum: ["client", "admin"], default: "client" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Utilisateur", utilisateurSchema);
