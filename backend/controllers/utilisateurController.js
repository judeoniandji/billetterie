const Utilisateur = require("../models/Utilisateur");

exports.createOrGetUser = async (req, res) => {
  try {
    console.log("Requête reçue:", req.body);
    const { prenom, nom, telephone, ville } = req.body;

    if (!telephone) {
      return res.status(400).json({ message: "Le numéro de téléphone est obligatoire !" });
    }

    let user = await Utilisateur.findOne({ telephone });
    console.log("Utilisateur trouvé:", user);

    if (user) {
      return res.status(200).json({ message: "Connexion réussie !", utilisateur: user });
    }

    if (!prenom || !nom) {
      return res.status(400).json({ message: "Veuillez vous inscrire d'abord !" });
    }

    user = new Utilisateur({
      prenom,
      nom,
      telephone,
      ville: ville || "Libreville"
    });

    const savedUser = await user.save();
    console.log("Nouvel utilisateur créé:", savedUser);
    res.status(201).json({ message: "Inscription réussie !", utilisateur: savedUser });
  } catch (error) {
    console.log("Erreur utilisateurController complète:", error);
    res.status(500).json({ message: "Erreur serveur: " + error.message, error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé !" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Erreur getUserById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
