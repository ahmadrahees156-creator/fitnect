
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { createToken } = require("../services/tokenService");
const { sendLoginAlert } = require("../services/emailService");

const googleClient = new OAuth2Client();
const validRoles = ["athlete", "coach"];

function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        emailVerified: user.emailVerified
    };
}

// POST /api/auth/google
async function googleLogin(req, res, next) {
    try {
        // Support both web clients using "credential" and mobile clients
        // sending the same Google ID token as "idToken".
        const { credential, idToken, role } = req.body;
        const googleToken = idToken || credential;

        if (typeof googleToken !== "string" || !googleToken) {
            return res.status(400).json({
                success: false,
                message: "Google ID token is required"
            });
        }

        // This must be your Web application OAuth client ID.
        // Mobile clients should request an ID token for this server client.
        const webClientId = process.env.GOOGLE_WEB_CLIENT_ID;

        if (!webClientId) {
            return res.status(503).json({
                success: false,
                message: "Google Sign-In is not configured"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: webClientId
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                success: false,
                message: "Google account could not be verified"
            });
        }

        const email = payload.email.trim().toLowerCase();

        // First, find an account already linked to this Google identity.
        let user = await User.findOne({ googleId: payload.sub });

        if (user) {
            user.emailVerified = true;
            user.avatar = payload.picture || user.avatar || "";
            await user.save();
        } else {
            // If an account with this verified email already exists,
            // link the Google identity to that account.
            user = await User.findOne({ email });

            if (user) {
                if (user.googleId && user.googleId !== payload.sub) {
                    return res.status(409).json({
                        success: false,
                        message: "This email is linked to another Google account"
                    });
                }

                user.googleId = payload.sub;
                user.emailVerified = true;
                user.avatar = payload.picture || user.avatar || "";
                await user.save();
            } else {
                const selectedRole = role || "athlete";

                if (!validRoles.includes(selectedRole)) {
                    return res.status(400).json({
                        success: false,
                        message: "Role must be athlete or coach"
                    });
                }

                user = await User.create({
                    name: payload.name || email.split("@")[0],
                    email,
                    googleId: payload.sub,
                    avatar: payload.picture || "",
                    role: selectedRole,
                    emailVerified: true
                });
            }
        }

        // Email notification must not block a successful sign-in.
        sendLoginAlert(user).catch((error) => {
            console.error("Google login notification failed:", error.message);
        });

        return res.status(200).json({
            success: true,
            message: "Google Sign-In successful",
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Account conflict. Please sign in again."
            });
        }

        // Invalid, expired, or incorrectly targeted Google ID token.
        if (
            error.name === "OAuth2ClientError" ||
            /token|audience|issuer|expired|verification/i.test(
                error.message || ""
            )
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired Google ID token"
            });
        }

        next(error);
    }
}

module.exports = { googleLogin };
