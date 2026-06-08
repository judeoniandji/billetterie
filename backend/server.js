require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
connectDB();
const startTTLWorker = require("./workers/ttlWorker");
startTTLWorker();

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

// Routes API
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
