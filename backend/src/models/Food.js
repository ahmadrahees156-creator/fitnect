const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    fdcId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },

    dataType: {
      type: String,
      default: "sr_legacy_food",
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    nutritionPer100g: {
      caloriesKcal: {
        type: Number,
        default: null,
        min: 0,
      },
      proteinG: {
        type: Number,
        default: null,
        min: 0,
      },
      carbohydratesG: {
        type: Number,
        default: null,
        min: 0,
      },
      fatG: {
        type: Number,
        default: null,
        min: 0,
      },
      fiberG: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    defaultServingGrams: {
      type: Number,
      default: null,
      min: 0,
    },

    source: {
      type: String,
      default: "USDA FoodData Central - SR Legacy",
    },

    sourceUrl: {
      type: String,
      default: "https://fdc.nal.usda.gov/",
    },
  },
  { timestamps: true }
);

foodSchema.index({ name: "text" });
foodSchema.index({ name: 1 });

module.exports = mongoose.model("Food", foodSchema);