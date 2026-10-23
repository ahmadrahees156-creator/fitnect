
const User = require("../models/User");
const crypto = require("crypto");
const { generateAndSendOTP, verifyOTP } = require("../services/otpService");
const { sendWelcomeEmail, sendLoginAlert, sendPasswordResetEmail,
    sendPasswordChangedEmail } = require("../services/emailService");
const { createToken } = require("../services/tokenService");
const PasswordResetToken = require("../models/PasswordResetToken");

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

        let existingUser = await User.findOne({
            email: cleanEmail
        });

        let user;
        
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


const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

function validPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= PASSWORD_MIN_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH
    );
}

function hashResetToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

// PATCH /api/auth/change-password
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            !validPassword(newPassword) ||
            typeof confirmPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide your current password, a valid new password, and confirmation"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match"
            });
        }

        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        // Google-only accounts may not have a password yet.
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account has no password set. Use the password recovery flow to set one."
            });
        }

        const currentPasswordMatches =
            await user.comparePassword(currentPassword);

        if (!currentPasswordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must differ from your current password"
            });
        }

        user.password = newPassword;
        await user.save();

        // Password has already changed; email failure should not undo it.
        sendPasswordChangedEmail(user).catch(error => {
            console.error("Password change notification failed:", error.message);
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please sign in again if prompted."
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
    try {
        const genericResponse = {
            success: true,
            message: "If an eligible account exists for this email, password reset instructions will be sent."
        };

        const { email } = req.body || {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Return the same message for unknown and ineligible accounts.
        const user = await User.findOne({
            email: cleanEmail,
            emailVerified: true
        });

        if (!user) {
            return res.status(200).json(genericResponse);
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

        await PasswordResetToken.deleteMany({ user: user._id });

        await PasswordResetToken.create({
            user: user._id,
            tokenHash,
            expiresAt
        });

        // Configure FRONTEND_URL to the trusted frontend origin.
        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            await PasswordResetToken.deleteMany({ user: user._id });

            console.error("FRONTEND_URL is missing; password reset email was not sent.");

            return res.status(200).json(genericResponse);
        }

        const resetUrl = new URL("/reset-password", frontendUrl);
        resetUrl.searchParams.set("token", rawToken);

        try {
            await sendPasswordResetEmail(user, resetUrl.toString());
        } catch (emailError) {
            await PasswordResetToken.deleteMany({ user: user._id });
            console.error("Password reset email failed:", emailError.message);
        }

        return res.status(200).json(genericResponse);
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
    try {
        const { token, newPassword, confirmPassword } = req.body || {};

        if (
            typeof token !== "string" ||
            !token ||
            !validPassword(newPassword) ||
            typeof confirmPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "A reset token, valid new password, and confirmation are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match"
            });
        }

        const tokenHash = hashResetToken(token);

        const resetRecord = await PasswordResetToken.findOneAndDelete({
            tokenHash,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: "Password reset token is invalid or expired. Request a new one."
            });
        }

        const user = await User.findById(resetRecord.user).select("+password");

        if (!user || !user.emailVerified) {
            await PasswordResetToken.deleteMany({ user: resetRecord.user });

            return res.status(400).json({
                success: false,
                message: "Password reset token is invalid or expired. Request a new one."
            });
        }

        if (user.password && await user.comparePassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Choose a password different from your current password"
            });
        }

        user.password = newPassword;
        await user.save();

        // Consume this token and any other outstanding reset token for this user.
        await PasswordResetToken.deleteMany({ user: user._id });

        sendPasswordChangedEmail(user).catch(error => {
            console.error("Password reset notification failed:", error.message);
        });

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please log in using your new password."
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    register,
    verifyEmail,
    resendOTP,
    login,
    changePassword,
    forgotPassword,
    resetPassword
};
