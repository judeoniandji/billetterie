const express = require("express");
const router = express.Router();
const utilisateurController = require("../controllers/utilisateurController");

router.post("/", utilisateurController.createOrGetUser);
router.get("/:id", utilisateurController.getUserById);

module.exports = router;
