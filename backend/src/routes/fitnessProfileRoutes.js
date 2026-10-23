
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getMyFitnessProfile,
  saveMyFitnessProfile
} = require("../controllers/fitnessProfileController");

router.get("/me", protect, getMyFitnessProfile);
router.put("/me", protect, saveMyFitnessProfile);

module.exports = router;
