
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  addNutrition,
  addFoodFromCatalogue,
  getTodayNutrition,
  getNutritionHistory,
} = require("../controllers/nutritionController");

router.use(protect);

router.post("/", addNutrition);
router.post("/from-catalogue", addFoodFromCatalogue);
router.get("/today", getTodayNutrition);
router.get("/history", getNutritionHistory);

module.exports = router;
