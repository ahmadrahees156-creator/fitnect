const crypto = require("crypto");
const EmailOTP = require("../models/EmailOTP");
const { sendOTPEmail } = require("./emailService");

function getOtpSecret() {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("OTP_SECRET (or JWT_SECRET) is missing from environment variables");
    }
    return secret;
}

function hashOTP(email, otp) {
    return crypto
        .createHmac("sha256", getOtpSecret())
        .update(`${email}:${otp}`)
        .digest("hex");
}

async function generateAndSendOTP(email, name = "") {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await EmailOTP.findOne({
        email: normalizedEmail
    });

    // Prevent repeatedly requesting new codes.
    if (
        existing &&
        Date.now() - existing.lastSentAt.getTime() < 60 * 1000
    ) {
        const error = new Error("Please wait 60 seconds before requesting another OTP.");
        error.statusCode = 429;
        throw error;
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    await EmailOTP.findOneAndUpdate(
        { email: normalizedEmail },
        {
            otpHash: hashOTP(normalizedEmail, otp),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            lastSentAt: new Date(),
            attempts: 0
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
        await sendOTPEmail({ email: normalizedEmail, name, otp });
    } catch (error) {
        await EmailOTP.deleteOne({ email: normalizedEmail });
        throw error;
    }

    return { expiresInMinutes: 10 };
}

async function verifyOTP(email, otp) {
    const normalizedEmail = email.toLowerCase().trim();

    const record = await EmailOTP.findOne({
        email: normalizedEmail
    });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
        const error = new Error("OTP is invalid or expired.");
        error.statusCode = 400;
        throw error;
    }

    if (record.attempts >= 5) {
        await EmailOTP.deleteOne({ _id: record._id });
        const error = new Error("Too many incorrect attempts. Request a new OTP.");
        error.statusCode = 429;
        throw error;
    }

    record.attempts += 1;
    await record.save();

    const submittedHash = Buffer.from(hashOTP(normalizedEmail, otp), "hex");
    const savedHash = Buffer.from(record.otpHash, "hex");

    const valid =
        submittedHash.length === savedHash.length &&
        crypto.timingSafeEqual(submittedHash, savedHash);

    if (!valid) {
        const error = new Error("OTP is invalid or expired.");
        error.statusCode = 400;
        throw error;
    }

    await EmailOTP.deleteOne({ _id: record._id });
    return true;
}

module.exports = { generateAndSendOTP, verifyOTP, getOtpSecret, hashOTP };
