require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();
const startTTLWorker = require("./workers/ttlWorker");
startTTLWorker(); // Lancement du processus en arrière-plan pour l'expiration des places

// Configuration CORS permissive temporaire pour le déploiement
app.use(cors());
app.use(express.json());

// En-têtes de sécurité de base
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Servir les fichiers statiques pour l'interface de test (Dossier Front-End séparé)
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));

// La route racine est maintenant gérée par le fichier index.html dans public
// app.get("/", (req, res) => { ... });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur sur port ${PORT}`);
});
console.log("Configuration de la base de données chargée.");
const reservationRoutes = require("./routes/reservationRoutes");
const evenementRoutes = require("./routes/evenementRoutes");
const utilisateurRoutes = require("./routes/utilisateurRoutes");

// Route rapide pour le frontend de test afin de récupérer un Utilisateur au hasard
app.get("/api/utilisateurs/test", async (req, res) => {
  const Utilisateur = require("./models/Utilisateur");
  const user = await Utilisateur.findOne();
  res.json(user);
});

app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/evenements", evenementRoutes);