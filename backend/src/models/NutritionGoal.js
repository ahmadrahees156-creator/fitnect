
const mongoose = require("mongoose");

const nutritionGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    caloriesKcal: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },

    proteinG: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },

    carbohydratesG: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },

    fatG: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "NutritionGoal",
  nutritionGoalSchema
);
