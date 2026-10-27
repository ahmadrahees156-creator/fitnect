const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  searchFoods,
  getFoodNutrition,
  getMealSummary,
  getNutritionTargets
} = require("../controllers/nutritionApiController");

const router = express.Router();

router.use(protect);

router.get("/foods", searchFoods);
router.get("/nutrition", getFoodNutrition);
router.post("/meal-summary", getMealSummary);
router.post("/nutrition-targets", getNutritionTargets);

module.exports = router;