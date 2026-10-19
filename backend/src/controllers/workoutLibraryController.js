
const mongoose = require("mongoose");
const WorkoutLibrary = require("../models/WorkoutLibrary");

const categories = [
  "strength",
  "cardio",
  "flexibility",
  "yoga",
  "sports",
  "other",
];

const difficulties = [
  "beginner",
  "intermediate",
  "advanced",
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getWorkoutLibrary = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        message: "page must be positive and limit must be between 1 and 50",
      });
    }

    const filter = { isActive: true };

    if (req.query.category) {
      if (!categories.includes(req.query.category)) {
        return res.status(400).json({
          message: "Invalid workout category",
        });
      }

      filter.category = req.query.category;
    }

    if (req.query.difficulty) {
      if (!difficulties.includes(req.query.difficulty)) {
        return res.status(400).json({
          message: "Invalid workout difficulty",
        });
      }

      filter.difficulty = req.query.difficulty;
    }

    if (req.query.search) {
      const search = String(req.query.search).trim();

      if (!search || search.length > 100) {
        return res.status(400).json({
          message: "Search must contain 1–100 characters",
        });
      }

      filter.name = {
        $regex: escapeRegex(search),
        $options: "i",
      };
    }

    const [workouts, total] = await Promise.all([
      WorkoutLibrary.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v"),

      WorkoutLibrary.countDocuments(filter),
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      workouts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkoutDetails = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid workout ID",
      });
    }

    const workout = await WorkoutLibrary.findOne({
      _id: req.params.id,
      isActive: true,
    }).select("-__v");

    if (!workout) {
      return res.status(404).json({
        message: "Workout not found",
      });
    }

    return res.status(200).json({ workout });
  } catch (error) {
    next(error);
  }
};
