
const User = require("../models/User");
const { generateAndSendOTP, verifyOTP } = require("../services/otpService");
const { sendWelcomeEmail, sendLoginAlert } = require("../services/emailService");
const { createToken } = require("../services/tokenService");

const validRoles = ["athlete", "coach"];

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        emailVerified: user.emailVerified
    };
}

// POST /api/auth/register
async function register(req, res, next) {
    try {
        const { name, email, password, role } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const selectedRole = role || "athlete";

        if (cleanName.length < 2 || cleanName.length > 60) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 60 characters"
            });
        }

        if (!validEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be between 8 and 72 characters"
            });
        }

        if (!validRoles.includes(selectedRole)) {
            return res.status(400).json({
                success: false,
                message: "Role must be athlete or coach"
            });
        }

        let user = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            if (existingUser.emailVerified) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }
            // If account exists but is unverified, update details and resend code
            existingUser.name = cleanName;
            existingUser.password = password;
            existingUser.role = selectedRole;
            await existingUser.save();
            user = existingUser;
        } else {
            user = await User.create({
                name: cleanName,
                email: cleanEmail,
                password,
                role: selectedRole,
                emailVerified: false
            });
        }

        // Send OTP verification code
        await generateAndSendOTP(user.email, user.name);

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email for the verification code.",
            email: user.email
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Please check the registration details"
            });
        }

        next(error);
    }
}

// POST /api/auth/verify-email
async function verifyEmail(req, res, next) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const cleanEmail = email.trim().toLowerCase();
        await verifyOTP(cleanEmail, otp);

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found" });
        }

        user.emailVerified = true;
        await user.save();

        // Send welcome email upon successful verification
        sendWelcomeEmail(user).catch((err) => console.error("Welcome email failed:", err.message));

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
}

// POST /api/auth/resend-otp
async function resendOTP(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });
        if (!user || user.emailVerified) {
            return res.status(200).json({ success: true, message: "If the account exists and is unverified, a new code has been sent." });
        }

        await generateAndSendOTP(user.email, user.name);

        return res.status(200).json({ success: true, message: "Verification code sent successfully" });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
}

// POST /api/auth/login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email address before logging in"
            });
        }

        sendLoginAlert(user).catch((error) => {
            console.error("Login notification failed:", error.message);
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { register, verifyEmail, resendOTP, login };
