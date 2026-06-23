const Reservation = require("../models/Reservation");
const Evenement = require("../models/Evenement");

const startTTLWorker = () => {
  console.log("🛠️  Worker TTL démarré : Écoute des expirations physiques via Change Streams (Pre-image)...");

  const initChangeStream = () => {
    // Utilisez "whenAvailable" au lieu de "required" pour éviter les erreurs si pas de pre-image
    const changeStream = Reservation.watch([], { fullDocumentBeforeChange: "whenAvailable" });

    changeStream.on("change", async (change) => {
      if (change.operationType === "delete") {
        try {
          const docSupprime = change.fullDocumentBeforeChange;
          
          if (docSupprime && docSupprime.statut === "EN_ATTENTE") {
            console.log(`⌛ Réservation ${change.documentKey._id} expirée par le TTL MongoDB.`);
            console.log(`   Restitution de ${docSupprime.nombre_places} places pour l'événement ${docSupprime.evenement_id}...`);
            
            const eventMisAJour = await Evenement.findByIdAndUpdate(docSupprime.evenement_id, {
              $inc: { places_disponibles: docSupprime.nombre_places }
            });
            
            if (eventMisAJour) {
              console.log(`✅ Places restituées avec succès (Dispo: ${eventMisAJour.places_disponibles + docSupprime.nombre_places}/${eventMisAJour.capacite_totale}).`);
            } else {
              console.error(`❌ Impossible de restituer les places : événement ${docSupprime.evenement_id} non trouvé.`);
            }
          }
        } catch (error) {
          console.error("Erreur dans le traitement de la suppression TTL Change Stream:", error);
        }
      }
    });

    changeStream.on("error", (error) => {
      console.warn("⚠️ Erreur Change Stream (reconnexion en cours):", error.message);
      // Fermer le stream défectueux et réinitialiser après un délai
      changeStream.close();
      setTimeout(initChangeStream, 2000);
    });
  };

  initChangeStream();
};

module.exports = startTTLWorker;
