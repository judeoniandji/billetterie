const express = require("express");
const router = express.Router();
const evenementController = require("../controllers/evenementController");

router.route("/")
  .get(evenementController.getEvenements)
  .post(evenementController.createEvenement);

// IMPORTANT : Placer cette route avant /:id pour éviter qu'elle soit considérée comme un ID
router.get("/stats/recettes", evenementController.getRecettesParEvenement);

router.route("/:id")
  .put(evenementController.updateEvenement)
  .delete(evenementController.deleteEvenement);

module.exports = router;
