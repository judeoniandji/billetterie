const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

router.post("/", reservationController.creerReservation);
router.post("/:id/payer", reservationController.payerReservation);
router.get("/utilisateur/:id", reservationController.getReservationsByUser);

module.exports = router;