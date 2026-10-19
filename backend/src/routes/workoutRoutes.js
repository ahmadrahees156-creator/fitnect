
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");

// All workout routes require login
router.use(protect);

// POST /api/workouts
router.post("/", createWorkout);

// GET /api/workouts
router.get("/", getWorkouts);

// GET /api/workouts/:id
router.get("/:id", getWorkoutById);

// PATCH /api/workouts/:id
router.patch("/:id", updateWorkout);

// DELETE /api/workouts/:id
router.delete("/:id", deleteWorkout);

module.exports = router;
