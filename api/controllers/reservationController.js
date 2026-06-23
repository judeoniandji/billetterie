const Reservation = require("../models/Reservation");
const Evenement = require("../models/Evenement");
const Billet = require("../models/Billet");
const mongoose = require("mongoose");
const crypto = require("crypto");

// @desc    Récupérer les réservations d'un utilisateur
// @route   GET /api/reservations/utilisateur/:id
exports.getReservationsByUser = async (req, res) => {
  try {
    const reservations = await Reservation.find({ utilisateur_id: req.params.id })
      .populate("evenement_id")
      .sort({ date_creation: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @desc    Récupérer les billets d'une réservation
// @route   GET /api/reservations/:id/billets
exports.getBilletsByReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate("evenement_id");
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    const billets = await Billet.find({ reservation_id: req.params.id });
    res.status(200).json({ reservation, billets });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @desc    Créer une réservation (Sécurisé par transaction ACID)
// @route   POST /api/reservations
exports.creerReservation = async (req, res) => {
  const { utilisateur_id, evenement_id, nombre_places } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Evenement.findById(evenement_id).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Vérifier que la date de l'événement n'est pas déjà passée
    const today = new Date();
    today.setHours(0, 0, 0, 0); // On ignore l'heure pour comparer la date seule
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Cet événement est déjà passé, impossible de réserver." });
    }

    // Décrémentation atomique sous verrouillage optimiste dans la session
    const updateResult = await Evenement.updateOne(
      { 
        _id: evenement_id, 
        places_disponibles: { $gte: nombre_places } 
      },
      { 
        $inc: { places_disponibles: -nombre_places } 
      }
    ).session(session);

    // Si pas de modification, cela signifie que les places disponibles sont insuffisantes
    if (updateResult.modifiedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Places insuffisantes pour cette réservation." });
    }

    // Création du document Réservation au statut EN_ATTENTE
    const nouvelleReservation = new Reservation({
      utilisateur_id,
      evenement_id,
      nombre_places,
      montant_total: nombre_places * event.prix
    });

    const reservationSauvegardee = await nouvelleReservation.save({ session });

    // Validation finale de la transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Réservation créée. Vous avez 10 minutes pour procéder au paiement.",
      reservation: reservationSauvegardee
    });

  } catch (error) {
    // Annulation en bloc des opérations (notamment la décrémentation des places)
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Erreur serveur lors de la réservation", error: error.message });
  }
};

// @desc    Confirmer le paiement et générer les billets (Sécurisé par transaction ACID)
// @route   POST /api/reservations/:id/payer
exports.payerReservation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(req.params.id).session(session);
    
    if (!reservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Réservation introuvable ou expirée." });
    }

    if (reservation.statut !== "EN_ATTENTE") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Cette réservation n'est plus en attente de paiement." });
    }

    // Changement de statut vers CONFIRMEE. 
    // Grâce au partialFilterExpression, l'index TTL cessera de cibler ce document.
    reservation.statut = "CONFIRMEE";
    await reservation.save({ session });

    // Génération des billets à haute entropie pour éviter toute collision sous charge
    const billets = [];
    for (let i = 0; i < reservation.nombre_places; i++) {
      const tokenUnique = crypto.randomBytes(8).toString("hex").toUpperCase();
      billets.push({
        reservation_id: reservation._id,
        evenement_id: reservation.evenement_id,
        utilisateur_id: reservation.utilisateur_id,
        code_barre: `GAB-${reservation.evenement_id.toString().substring(0, 4)}-${tokenUnique}-${i}`
      });
    }

    await Billet.insertMany(billets, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Paiement confirmé, billets générés avec succès.",
      reservation,
      billets
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Erreur serveur lors de la confirmation du paiement", error: error.message });
  }
};