const mongoose = require("mongoose");

const wellnessCheckInSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        date: {
            type: Date,
            required: true
        },

        mood: {
            type: String,
            enum: ["great", "good", "okay", "low", "bad"],
            required: true
        },

        energy: {
            type: Number,
            min: 1,
            max: 10,
            required: true
        },

        sleepHours: {
            type: Number,
            min: 0,
            max: 24,
            required: true
        },

        sleepQuality: {
            type: String,
            enum: ["poor", "fair", "good", "excellent"],
            required: true
        },

        stress: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },

        soreness: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

wellnessCheckInSchema.index(
    { user: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "WellnessCheckIn",
    wellnessCheckInSchema
);