
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { createToken } = require("../services/tokenService");

const googleClient = new OAuth2Client();

const validRoles = ["athlete", "coach"];

function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || ""
    };
}

// POST /api/auth/google
async function googleLogin(req, res, next) {
    try {
        const { credential, role } = req.body;

        if (typeof credential !== "string" || !credential) {
            return res.status(400).json({
                success: false,
                message: "Google ID token is required"
            });
        }

        const clientIds = (process.env.GOOGLE_CLIENT_IDS || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (clientIds.length === 0) {
            return res.status(503).json({
                success: false,
                message: "Google Sign-In is not configured"
            });
        }

        // Verify signature, issuer, audience and expiration.
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: clientIds
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

        // Find the existing Google account first.
        let user = await User.findOne({
            googleId: payload.sub
        });

        if (user) {
            // Do not let a login request change an existing user's role.
            user.avatar = payload.picture || user.avatar || "";
            await user.save();
        } else {
            user = await User.findOne({ email });

            if (user) {
                // Link a verified Google account to an existing
                // email account, but never replace another Google ID.
                if (user.googleId && user.googleId !== payload.sub) {
                    return res.status(409).json({
                        success: false,
                        message: "This email is linked to another Google account"
                    });
                }

                user.googleId = payload.sub;
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
                    role: selectedRole
                });
            }
        }

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

        // Invalid or expired Google tokens should not become
        // generic server errors.
        if (
            error.message &&
            /token|audience|issuer|expired|verification/i.test(error.message)
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
