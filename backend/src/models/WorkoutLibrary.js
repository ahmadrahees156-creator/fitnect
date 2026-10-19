
const mongoose = require("mongoose");

const workoutLibrarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      enum: [
        "strength",
        "cardio",
        "flexibility",
        "yoga",
        "sports",
        "other",
      ],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    targetMuscles: [{
      type: String,
      trim: true,
    }],

    equipment: [{
      type: String,
      trim: true,
    }],

    instructions: [{
      type: String,
      trim: true,
      maxlength: 500,
    }],

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    durationMinutes: {
      type: Number,
      min: 1,
      max: 600,
      default: 15,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

workoutLibrarySchema.index({
  category: 1,
  difficulty: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  "WorkoutLibrary",
  workoutLibrarySchema
);
