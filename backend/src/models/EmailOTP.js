
const mongoose = require("mongoose");

const emailOTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    lastSentAt: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("EmailOTP", emailOTPSchema);
