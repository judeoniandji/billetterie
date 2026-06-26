require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Mode démo : skip MongoDB connection si MONGO_URI n'est pas défini
if (process.env.MONGO_URI) {
  const connectDB = require("./config/db");
  connectDB();
  const startTTLWorker = require("./workers/ttlWorker");
  startTTLWorker();
} else {
  console.log("⚠️ Mode démo : MongoDB non configuré, serveur en mode statique uniquement");
}

// Configuration CORS
app.use(cors());
app.use(express.json());

// En-têtes de sécurité
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Routes API (seulement si MongoDB est configuré)
if (process.env.MONGO_URI) {
  const reservationRoutes = require("./routes/reservationRoutes");
  const evenementRoutes = require("./routes/evenementRoutes");
  const utilisateurRoutes = require("./routes/utilisateurRoutes");

  app.get("/api/utilisateurs/test", async (req, res) => {
    const Utilisateur = require("./models/Utilisateur");
    const user = await Utilisateur.findOne();
    res.json(user);
  });

  app.use("/api/utilisateurs", utilisateurRoutes);
  app.use("/api/reservations", reservationRoutes);
  app.use("/api/evenements", evenementRoutes);
} else {
  // API mock pour le mode démo
  app.get("/api/evenements", (req, res) => {
    res.json([
      {
        _id: "1",
        titre: "Concert de NG Bling",
        description: "Un grand événement inédit au Gabon",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lieu: "Stade de l'Amitié, Akanda",
        prix: 15000,
        capacite_totale: 5000,
        places_disponibles: 3500,
        image: "https://images.unsplash.com/photo-1540039155732-61ee0150937c?auto=format&fit=crop&w=800&q=80",
        categorie: "Concert"
      },
      {
        _id: "2",
        titre: "Festival Gabon 9 Provinces",
        description: "Célébration de la culture gabonaise",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        lieu: "Institut Français, Libreville",
        prix: 25000,
        capacite_totale: 3000,
        places_disponibles: 2000,
        image: "https://images.unsplash.com/photo-1470229722913-7c090be5c520?auto=format&fit=crop&w=800&q=80",
        categorie: "Festival"
      }
    ]);
  });
}

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Catch-all SPA (Express 5 : syntaxe {*path} requise)
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur sur port ${PORT}`);
});
console.log("Configuration de la base de données chargée.");
