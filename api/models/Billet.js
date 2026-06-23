const mongoose = require("mongoose");

const billetSchema = new mongoose.Schema(
  {
    reservation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    evenement_id: { type: mongoose.Schema.Types.ObjectId, ref: "Evenement", required: true },
    utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur", required: true },
    code_barre: { type: String, required: true, unique: true }, // Un identifiant unique pour le contrôle d'accès
    statut: { type: String, enum: ["VALIDE", "UTILISE", "ANNULE"], default: "VALIDE" }
  },
  { timestamps: true }
);

// INDEX pour accélérer les jointures ($lookup) et filtres fréquents
billetSchema.index({ reservation_id: 1 });
billetSchema.index({ utilisateur_id: 1 });
billetSchema.index({ evenement_id: 1 });

module.exports = mongoose.model("Billet", billetSchema);
