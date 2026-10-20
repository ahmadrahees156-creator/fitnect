
const mongoose = require("mongoose");

const coachAthleteSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
      required: true,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

coachAthleteSchema.index(
  { coach: 1, athlete: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CoachAthlete",
  coachAthleteSchema
);
