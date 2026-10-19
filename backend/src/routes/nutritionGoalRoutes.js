
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getGoals,
  saveGoals,
  getTodayProgress,
} = require("../controllers/nutritionGoalController");

router.use(protect);

router.get("/", getGoals);
router.put("/", saveGoals);
router.get("/progress/today", getTodayProgress);

module.exports = router;
