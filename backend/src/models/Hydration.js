
const mongoose = require("mongoose");

const hydrationSchema = new mongoose.Schema(
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

    amountMl: {
      type: Number,
      required: true,
      min: 1,
      max: 20000,
    },

    beverageType: {
      type: String,
      enum: [
        "water",
        "electrolyte",
        "milk",
        "juice",
        "other",
      ],
      default: "water",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

hydrationSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Hydration", hydrationSchema);
