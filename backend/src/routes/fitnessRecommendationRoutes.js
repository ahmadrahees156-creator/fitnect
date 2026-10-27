
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMyFitnessRecommendations
} = require("../controllers/fitnessRecommendationController");

const router = express.Router();

router.get("/me", protect, getMyFitnessRecommendations);

module.exports = router;
