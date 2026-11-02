const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadImageMiddleware,
  analyzeInjuryPhoto,
} = require("../controllers/imageAnalysisController");

const router = express.Router();

// POST /api/image-analysis/predict
router.post("/predict", protect, uploadImageMiddleware, analyzeInjuryPhoto);

module.exports = router;
