// Script de peuplement de la base de données pour mongosh
// Usage: mongosh < seed.js (ou load("data/seed.js") dans mongosh)

// Nettoyage des collections
db.utilisateurs.deleteMany({});
db.evenements.deleteMany({});
db.reservations.deleteMany({});
db.billets.deleteMany({});
print("Base de données nettoyée.");

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
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f565?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Génération des utilisateurs (35)
const utilisateurs = [];
utilisateurs.push({
  nom: "Oniandji",
  prenom: "Jude",
  email: "jude@eventpass.com",
  telephone: "+241700000001",
  ville: "Libreville",
  role: "admin"
});
utilisateurs.push({
  nom: "Bouala Nukafo",
  prenom: "Kingsy Jones",
  email: "kingsy@eventpass.com",
  telephone: "+241700000002",
  ville: "Port-Gentil",
  role: "admin"
});
utilisateurs.push({
  nom: "Makaya",
  prenom: "Taliane",
  email: "taliane@eventpass.com",
  telephone: "+241700000003",
  ville: "Franceville",
  role: "admin"
});

for (let i = 0; i < 32; i++) {
  const nom = noms[getRandomInt(0, noms.length - 1)];
  const prenom = prenoms[getRandomInt(0, prenoms.length - 1)];
  utilisateurs.push({
    nom,
    prenom,
    email: `${prenom.toLowerCase()}.${nom.toLowerCase()}${i}@gmail.com`,
    telephone: `+2417${getRandomInt(4, 7)}${getRandomInt(100000, 999999)}`,
    ville: villes[getRandomInt(0, villes.length - 1)]
  });
}

const resultUtilisateurs = db.utilisateurs.insertMany(utilisateurs);
print(`${resultUtilisateurs.length} utilisateurs insérés.`);

// Génération des événements (30)
const evenements = [];
for (let i = 0; i < 30; i++) {
  const capacite = getRandomInt(100, 5000);
  const titresIndex = getRandomInt(0, titresEvent.length - 1);
  evenements.push({
    titre: `${titresEvent[titresIndex]} - Édition ${i + 1}`,
    description: `Un grand événement inédit au Gabon pour célébrer la musique.`,
    date: new Date(Date.now() + getRandomInt(1, 60) * 24 * 60 * 60 * 1000),
    lieu: lieuxEvent[getRandomInt(0, lieuxEvent.length - 1)],
    prix: getRandomInt(2, 20) * 5000,
    capacite_totale: capacite,
    places_disponibles: capacite,
    image: imagesConcerts[getRandomInt(0, imagesConcerts.length - 1)]
  });
}

const resultEvenements = db.evenements.insertMany(evenements);
print(`${resultEvenements.length} événements insérés.`);

// Génération des réservations (35)
const reservations = [];
const billets = [];

for (let i = 0; i < 35; i++) {
  const user = resultUtilisateurs[getRandomInt(0, resultUtilisateurs.length - 1)];
  const event = resultEvenements[getRandomInt(0, resultEvenements.length - 1)];
  const nbPlaces = getRandomInt(1, 5);
  const isConfirmed = Math.random() > 0.3;
  const statut = isConfirmed ? "CONFIRMEE" : "EN_ATTENTE";
  const dateCreation = isConfirmed 
    ? new Date(Date.now() - getRandomInt(1, 10) * 24 * 60 * 60 * 1000)
    : new Date(Date.now() - getRandomInt(0, 2) * 60 * 1000);

  const resObj = {
    utilisateur_id: user._id,
    evenement_id: event._id,
    nombre_places: nbPlaces,
    statut: statut,
    montant_total: nbPlaces * event.prix,
    date_creation: dateCreation
  };

  if (isConfirmed) {
    db.evenements.updateOne(
      { _id: event._id },
      { $inc: { places_disponibles: -nbPlaces } }
    );
  }

  reservations.push(resObj);
}

const resultReservations = db.reservations.insertMany(reservations);
print(`${resultReservations.length} réservations insérées.`);

// Génération des billets pour les réservations confirmées
const confirmedReservations = resultReservations.filter(r => r.statut === "CONFIRMEE");
for (const res of confirmedReservations) {
  for (let j = 0; j < res.nombre_places; j++) {
    billets.push({
      reservation_id: res._id,
      evenement_id: res.evenement_id,
      utilisateur_id: res.utilisateur_id,
      code_barre: `GAB-${res.evenement_id.toString().substring(0, 4)}-${Date.now()}-${getRandomInt(1000, 9999)}-${j}`,
      statut: "VALIDE"
    });
  }
}

const resultBillets = db.billets.insertMany(billets);
print(`${resultBillets.length} billets insérés.`);

print("Seed terminé avec succès !");
