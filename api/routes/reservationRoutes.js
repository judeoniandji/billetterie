const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

router.post("/", reservationController.creerReservation);
router.get("/utilisateur/:id", reservationController.getReservationsByUser);
router.get("/:id/billets", reservationController.getBilletsByReservation);
router.post("/:id/payer", reservationController.payerReservation);

module.exports = router;