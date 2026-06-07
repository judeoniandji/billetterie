require("dotenv").config();
const mongoose = require("mongoose");
const Utilisateur = require("./models/Utilisateur");
const Evenement = require("./models/Evenement");
const Reservation = require("./models/Reservation");
const Billet = require("./models/Billet");

// Données d'exemple gabonaises
const noms = ["Ndong", "Moussavou", "Mba", "Obame", "Biyoghe", "Ngoma", "Koumba", "Nziengui", "Nzoghe", "Essono"];
const prenoms = ["Jude", "Alain", "Chancia", "Marc", "Sylvie", "Kevin", "Grace", "Hervé", "Léa", "Paul"];
const villes = ["Libreville", "Port-Gentil", "Franceville", "Owendo", "Akanda"];

const lieuxEvent = ["Stade de l'Amitié, Akanda", "Institut Français, Libreville", "Palais des Sports, Libreville", "Casino Croisette, Libreville"];
const titresEvent = ["Concert de NG Bling", "Festival Gabon 9 Provinces", "Showcase Shan'L", "Soirée Ndjoka", "Live Acoustique Ndong"];
const imagesConcerts = [
  "https://images.unsplash.com/photo-1540039155732-61ee0150937c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c090be5c520?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80"
];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateUtilisateurs = (count) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const nom = noms[getRandomInt(0, noms.length - 1)];
    const prenom = prenoms[getRandomInt(0, prenoms.length - 1)];
    users.push({
      nom,
      prenom,
      email: `${prenom.toLowerCase()}.${nom.toLowerCase()}${i}@gmail.com`,
      telephone: `+2417${getRandomInt(4, 7)}${getRandomInt(100000, 999999)}`,
      ville: villes[getRandomInt(0, villes.length - 1)]
    });
  }
  return users;
};

const generateEvenements = (count) => {
  const events = [];
  for (let i = 0; i < count; i++) {
    const capacite = getRandomInt(100, 5000);
    const titresIndex = getRandomInt(0, titresEvent.length - 1);
    events.push({
      titre: `${titresEvent[titresIndex]} - Édition ${i + 1}`,
      description: `Un grand événement inédit au Gabon pour célébrer la musique.`,
      date: new Date(Date.now() + getRandomInt(1, 60) * 24 * 60 * 60 * 1000), // Date future (1 à 60 jours)
      lieu: lieuxEvent[getRandomInt(0, lieuxEvent.length - 1)],
      prix: getRandomInt(2, 20) * 5000, // Prix en FCFA (10000, 15000, etc.)
      capacite_totale: capacite,
      places_disponibles: capacite,
      image: imagesConcerts[getRandomInt(0, imagesConcerts.length - 1)]
    });
  }
  return events;
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connecté à MongoDB Atlas.");

    // Nettoyage de la base
    await Utilisateur.deleteMany({});
    await Evenement.deleteMany({});
    await Reservation.deleteMany({});
    await Billet.deleteMany({});
    console.log("Base de données nettoyée.");

    // Insertion Utilisateurs (35)
    const utilisateursData = generateUtilisateurs(35);
    const utilisateurs = await Utilisateur.insertMany(utilisateursData);
    console.log(`${utilisateurs.length} utilisateurs insérés.`);

    // Insertion Evénements (30)
    const evenementsData = generateEvenements(30);
    const evenements = await Evenement.insertMany(evenementsData);
    console.log(`${evenements.length} événements insérés.`);

    // Insertion Réservations (35)
    const reservationsData = [];
    const billetsData = [];

    for (let i = 0; i < 35; i++) {
      const user = utilisateurs[getRandomInt(0, utilisateurs.length - 1)];
      const event = evenements[getRandomInt(0, evenements.length - 1)];
      const nbPlaces = getRandomInt(1, 5);

      // On va faire en sorte que 70% des réservations soient CONFIRMEES et le reste EN_ATTENTE
      const isConfirmed = Math.random() > 0.3;
      const statut = isConfirmed ? "CONFIRMEE" : "EN_ATTENTE";

      // On simule une réservation passée pour celles confirmées, et très récente pour celles en attente (pour le TTL)
      const dateCreation = isConfirmed 
        ? new Date(Date.now() - getRandomInt(1, 10) * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - getRandomInt(0, 2) * 60 * 1000); // Il y a moins de 2 minutes

      const resObj = {
        utilisateur_id: user._id,
        evenement_id: event._id,
        nombre_places: nbPlaces,
        statut: statut,
        montant_total: nbPlaces * event.prix,
        date_creation: dateCreation
      };

      // Si confirmé, on génère les billets
      if (isConfirmed) {
        // Mise à jour de la disponibilité
        await Evenement.findByIdAndUpdate(event._id, { $inc: { places_disponibles: -nbPlaces } });
      }

      reservationsData.push(resObj);
    }

    const reservations = await Reservation.insertMany(reservationsData);
    console.log(`${reservations.length} réservations insérées.`);

    // Génération des billets pour les réservations confirmées
    const confirmedReservations = reservations.filter(r => r.statut === "CONFIRMEE");
    for (const res of confirmedReservations) {
      for (let j = 0; j < res.nombre_places; j++) {
        billetsData.push({
          reservation_id: res._id,
          evenement_id: res.evenement_id,
          utilisateur_id: res.utilisateur_id,
          code_barre: `GAB-${res.evenement_id.toString().substring(0, 4)}-${Date.now()}-${getRandomInt(1000, 9999)}-${j}`,
          statut: "VALIDE"
        });
      }
    }

    const billets = await Billet.insertMany(billetsData);
    console.log(`${billets.length} billets insérés.`);

    console.log("Seed terminé avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors du seed:", error);
    process.exit(1);
  }
};

seedDB();
