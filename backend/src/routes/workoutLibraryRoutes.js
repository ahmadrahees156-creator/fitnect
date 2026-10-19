
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getWorkoutLibrary,
  getWorkoutDetails,
} = require("../controllers/workoutLibraryController");

router.use(protect);

router.get("/", getWorkoutLibrary);
router.get("/:id", getWorkoutDetails);

module.exports = router;
