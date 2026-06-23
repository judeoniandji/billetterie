const mongoose = require("mongoose");

// EXPLICATION POUR LE RAPPORT (Referencing vs Embedding) :
// Nous avons choisi le référencement (Referencing) pour l'utilisateur et l'événement 
// car les informations de l'utilisateur (email, tel) et de l'événement (prix, date) 
// peuvent évoluer indépendamment de la réservation. Une réservation n'est qu'un "lien" temporaire.

const reservationSchema = new mongoose.Schema(
  {
    utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur", required: true },
    evenement_id: { type: mongoose.Schema.Types.ObjectId, ref: "Evenement", required: true },
    nombre_places: { type: Number, required: true, min: 1 },
    statut: { 
      type: String, 
      enum: ["EN_ATTENTE", "CONFIRMEE", "EXPIREE"], 
      default: "EN_ATTENTE" 
    },
    montant_total: { type: Number, required: true }, // Calculé à la création (nombre_places * prix)
    // Champ utilisé pour l'index TTL
    date_creation: { type: Date, default: Date.now }
  },
  { changeStreamPreAndPostImages: { enabled: true } } // Activer le stockage de la pre-image pour le worker TTL
);

// INDEX pour optimiser les jointures et filtres sur les clés étrangères
reservationSchema.index({ utilisateur_id: 1 });
reservationSchema.index({ evenement_id: 1 });

// INDEX TTL (FOCUS NOSQL DU GROUPE 9) : Expiration automatique des réservations non payées
// Justification : Le cahier des charges exige que les réservations expirent après 10 minutes sans paiement.
// Cet index TTL dit à MongoDB : "Supprime ce document 600 secondes (10 minutes) après date_creation,
// MAIS UNIQUEMENT SI le statut est 'EN_ATTENTE'".
// Le partialFilterExpression garantit que seules les réservations non confirmées sont supprimées automatiquement.
// Le worker TTL (ttlWorker.js) surveille ces suppressions pour réincrémenter les places disponibles.
reservationSchema.index(
  { date_creation: 1 },
  {
    expireAfterSeconds: 600,
    partialFilterExpression: { statut: "EN_ATTENTE" }
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);
