
const mongoose = require("mongoose");

const fitnessProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    age: {
      type: Number,
      required: true,
      min: 13,
      max: 120
    },

    heightCm: {
      type: Number,
      required: true,
      min: 80,
      max: 250
    },

    weightKg: {
      type: Number,
      required: true,
      min: 20,
      max: 500
    },

    // Calculated by the backend, never trusted from the client.
    bmi: {
      type: Number,
      required: true,
      min: 0
    },

    goal: {
      type: String,
      required: true,
      enum: [
        "strength",
        "weight_gain",
        "weight_management",
        "endurance",
        "general_fitness"
      ]
    },

    activityLevel: {
      type: String,
      required: true,
      enum: ["sedentary", "light", "moderate", "high"]
    },

    experienceLevel: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"]
    },

    workoutLocation: {
      type: String,
      required: true,
      enum: ["home", "gym", "both"]
    },

    dietaryPreference: {
      type: String,
      required: true,
      enum: [
        "vegetarian",
        "non_vegetarian",
        "vegan",
        "other"
      ]
    },

    onboardingCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "FitnessProfile",
  fitnessProfileSchema
);
