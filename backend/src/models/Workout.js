const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Workout title is required"],
      trim: true,
      maxlength: 100,
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

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },

    exercises: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },

        sets: {
          type: Number,
          min: 1,
          max: 100,
        },

        reps: {
          type: Number,
          min: 1,
          max: 1000,
        },

        weightKg: {
          type: Number,
          min: 0,
          max: 2000,
        },

        durationSeconds: {
          type: Number,
          min: 1,
        },

        distanceKm: {
          type: Number,
          min: 0,
        },
      },
    ],

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Workout", workoutSchema);