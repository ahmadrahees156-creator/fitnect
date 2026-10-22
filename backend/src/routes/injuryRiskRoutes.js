
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    predictMyInjuryRisk,
} = require("../controllers/injuryRiskController");

const router = express.Router();

router.post("/predict", protect, predictMyInjuryRisk);

module.exports = router;
