const mongoose = require("mongoose");

const evenementSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    lieu: { type: String, required: true }, // Ex: "Stade de l'Amitié, Libreville"
    prix: { type: Number, required: true, min: 0 }, // En FCFA
    capacite_totale: { type: Number, required: true, min: 1 },
    places_disponibles: { type: Number, required: true, min: 0 },
    image: { type: String, default: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80" },
    // On pourrait embarquer (embed) des artistes si c'est un concert multi-artistes
    artistes: [{ nom: String, heure_passage: String }]
  },
  { timestamps: true }
);

// INDEX 1 (COMPOSÉ) : Recherche par date et lieu
// Justification : Les utilisateurs recherchent souvent des événements par date et par lieu.
// Ce composé permet d'optimiser les requêtes du type "Quels événements à Libreville en décembre ?"
evenementSchema.index({ date: 1, lieu: 1 });

// INDEX 2 : Index sur le prix pour les filtres de prix
// Justification : Permet aux utilisateurs de filtrer les événements par fourchette de prix.
// Optimise les requêtes avec $lte ou $gte sur le champ prix.
evenementSchema.index({ prix: 1 });

// INDEX 4 (BONUS) : Index text pour la recherche plein texte
// Justification : Permet aux utilisateurs de rechercher des événements par mots-clés dans le titre et la description.
// Optimise les requêtes avec l'opérateur $text pour la recherche sémantique.
evenementSchema.index({ titre: "text", description: "text" });

module.exports = mongoose.model("Evenement", evenementSchema);
