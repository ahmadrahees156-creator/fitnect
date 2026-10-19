
const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: 100,
    },

    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },

    servingSize: {
      type: Number,
      required: true,
      min: 0.1,
      max: 10000,
    },

    servingUnit: {
      type: String,
      enum: ["g", "ml", "piece", "cup", "serving"],
      default: "serving",
    },

    calories: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },

    protein: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },

    carbohydrates: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },

    fat: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  { timestamps: true }
);

nutritionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Nutrition", nutritionSchema);
