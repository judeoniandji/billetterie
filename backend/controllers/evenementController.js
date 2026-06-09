const Evenement = require("../models/Evenement");

// @desc    Récupérer tous les événements (avec filtres optionnels, pagination et recherche textuelle)
// @route   GET /api/evenements
exports.getEvenements = async (req, res) => {
  try {
    // Opérations CRUD - Find avec filtres (Exigence CDC)
    const filtres = {};
    
    // Filtre par lieu avec regex échappée pour prévenir les vulnérabilités ReDoS
    if (req.query.lieu) {
      // Nettoyer l'entrée utilisateur pour neutraliser les métacaractères regex
      const escapedLieu = String(req.query.lieu).replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
      filtres.lieu = { $regex: escapedLieu, $options: "i" };
    }
    
    // Filtre par prix avec opérateur logique ($lte)
    if (req.query.prix_max) filtres.prix = { $lte: Number(req.query.prix_max) };
    
    // Filtre par prix minimum avec opérateur logique ($gte)
    if (req.query.prix_min) filtres.prix = { ...filtres.prix, $gte: Number(req.query.prix_min) };
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Recherche textuelle (si index text est configuré)
    let query = Evenement.find(filtres);
    if (req.query.recherche) {
      // Utilisation de $text pour la recherche plein texte
      filtres.$text = { $search: String(req.query.recherche) };
      query = Evenement.find(filtres, { score: { $meta: "textScore" } });
    }

    const evenements = await query
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    // Comptage total pour la pagination
    const total = await Evenement.countDocuments(filtres);

    // RETOURNE DIRECTEMENT LE TABLEAU (pour compatibilité frontend)
    res.status(200).json(evenements);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @desc    Créer un événement
// @route   POST /api/evenements
exports.createEvenement = async (req, res) => {
  try {
    // Opérations CRUD - insertOne
    const nouvelEvenement = new Evenement(req.body);
    const eventSauvegarde = await nouvelEvenement.save();
    res.status(201).json(eventSauvegarde);
  } catch (error) {
    res.status(400).json({ message: "Données invalides", error: error.message });
  }
};

// @desc    Mettre à jour un événement
// @route   PUT /api/evenements/:id
exports.updateEvenement = async (req, res) => {
  try {
    const eventId = req.params.id;
    const updateData = { ...req.body };

    // Si on cherche à modifier la capacité de l'événement
    if (updateData.capacite_totale !== undefined) {
      const Billet = require("../models/Billet");
      // Compter le nombre de billets déjà vendus (statut VALIDE ou UTILISE)
      const placesVendues = await Billet.countDocuments({ 
        evenement_id: eventId, 
        statut: { $in: ["VALIDE", "UTILISE"] } 
      });
      
      const nouvelleCapacite = Number(updateData.capacite_totale);
      if (nouvelleCapacite < placesVendues) {
        return res.status(400).json({ 
          message: `La capacité totale ne peut pas être inférieure au nombre de billets déjà vendus (${placesVendues}).` 
        });
      }
      
      // Ajuster dynamiquement les places disponibles restantes
      updateData.places_disponibles = nouvelleCapacite - placesVendues;
    }

    const eventMisAJour = await Evenement.findByIdAndUpdate(
      eventId, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );
    if (!eventMisAJour) return res.status(404).json({ message: "Événement non trouvé" });
    res.status(200).json(eventMisAJour);
  } catch (error) {
    res.status(400).json({ message: "Erreur de mise à jour", error: error.message });
  }
};

// @desc    Supprimer un événement (avec suppression en cascade des réservations/billets via transaction)
// @route   DELETE /api/evenements/:id
exports.deleteEvenement = async (req, res) => {
  const mongoose = require("mongoose");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventId = req.params.id;
    
    // Supprimer l'événement principal
    const eventSupprime = await Evenement.findByIdAndDelete(eventId).session(session);
    if (!eventSupprime) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    // Nettoyage en cascade des réservations et billets liés
    const Reservation = require("../models/Reservation");
    const Billet = require("../models/Billet");
    
    await Reservation.deleteMany({ evenement_id: eventId }).session(session);
    await Billet.deleteMany({ evenement_id: eventId }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Événement et ses données associées (réservations, billets) supprimés avec succès." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'événement", error: error.message });
  }
};

// @desc    Agréger les recettes par événement (LIVRABLE GROUPE 9)
// @route   GET /api/evenements/stats/recettes
exports.getRecettesParEvenement = async (req, res) => {
  try {
    const Reservation = require("../models/Reservation");
    
    const statsRecettes = await Reservation.aggregate([
      // 1. Filtrer uniquement les réservations confirmées (payées)
      { $match: { statut: "CONFIRMEE" } },
      
      // 2. Grouper par événement et sommer le montant_total
      { 
        $group: {
          _id: "$evenement_id",
          recettes_totales: { $sum: "$montant_total" },
          billets_vendus: { $sum: "$nombre_places" }
        }
      },
      
      // 3. Faire une jointure (lookup) avec la collection evenements pour récupérer le titre
      {
        $lookup: {
          from: "evenements", // nom de la collection dans la base
          localField: "_id",
          foreignField: "_id",
          as: "details_evenement"
        }
      },
      
      // 4. Déconstruire le tableau details_evenement pour le simplifier
      { $unwind: "$details_evenement" },
      
      // 5. Projeter les champs que l'on veut retourner à l'utilisateur
      {
        $project: {
          _id: 0,
          id_evenement: "$_id",
          titre: "$details_evenement.titre",
          recettes_FCFA: "$recettes_totales",
          billets_vendus: "$billets_vendus"
        }
      },
      
      // 6. Trier par recettes décroissantes
      { $sort: { recettes_FCFA: -1 } }
    ]);

    res.status(200).json(statsRecettes);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'agrégation", error: error.message });
  }
};
