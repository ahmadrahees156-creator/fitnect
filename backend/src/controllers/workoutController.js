
const mongoose = require("mongoose");
const Workout = require("../models/Workout");

// Create a workout
const createWorkout = async (req, res, next) => {
  try {
    const {
      title,
      category,
      date,
      durationMinutes,
      exercises,
      notes,
    } = req.body;

    if (
      !title ||
      !category ||
      durationMinutes === undefined ||
      !Array.isArray(exercises)
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, category, duration, and exercises are required.",
      });
    }

    const workout = await Workout.create({
      user: req.user.id,
      title,
      category,
      date: date || new Date(),
      durationMinutes,
      exercises,
      notes: notes || "",
    });

    return res.status(201).json({
      success: true,
      message: "Workout created successfully.",
      workout,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// Get all workouts belonging to the logged-in user
const getWorkouts = async (req, res, next) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;

    const parsedLimit = Number(limit);
    const parsedPage = Number(page);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100 ||
      !Number.isInteger(parsedPage) ||
      parsedPage < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be 1–100 and page must be at least 1.",
      });
    }

    const filter = { user: req.user.id };

    if (category) {
      const validCategories = [
        "strength",
        "cardio",
        "flexibility",
        "yoga",
        "sports",
        "other",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid workout category.",
        });
      }

      filter.category = category;
    }

    const [workouts, total] = await Promise.all([
      Workout.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Workout.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: workouts.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      workouts,
    });
  } catch (error) {
    next(error);
  }
};

// Get one workout
const getWorkoutById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workout ID.",
      });
    }

    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found.",
      });
    }

    return res.status(200).json({
      success: true,
      workout,
    });
  } catch (error) {
    next(error);
  }
};

// Update a workout
const updateWorkout = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workout ID.",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "date",
      "durationMinutes",
      "exercises",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const workout = await Workout.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Workout updated successfully.",
      workout,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// Delete a workout
const deleteWorkout = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workout ID.",
      });
    }

    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Workout deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};
