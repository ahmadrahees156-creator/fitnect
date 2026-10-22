
const User = require("../models/User");

// GET /api/users/me
async function getMyProfile(req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar || "",
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/users/me
async function updateMyProfile(req, res, next) {
    try {
        const { name, avatar } = req.body;

        // Only allow fields that belong in profile editing.
        const allowedFields = ["name", "avatar"];
        const suppliedFields = Object.keys(req.body || {});

        const invalidFields = suppliedFields.filter(
            field => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "These fields cannot be updated through this endpoint",
                fields: invalidFields
            });
        }

        if (suppliedFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Name must be a string"
                });
            }

            const cleanName = name.trim();

            if (cleanName.length < 2 || cleanName.length > 60) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain between 2 and 60 characters"
                });
            }

            user.name = cleanName;
        }

        if (avatar !== undefined) {
            if (typeof avatar !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Avatar must be a string"
                });
            }

            const cleanAvatar = avatar.trim();

            // Empty string removes the current avatar URL.
            // This endpoint accepts a URL, not an uploaded image file.
            if (cleanAvatar.length > 2048) {
                return res.status(400).json({
                    success: false,
                    message: "Avatar value is too long"
                });
            }

            if (cleanAvatar !== "") {
                try {
                    const avatarUrl = new URL(cleanAvatar);

                    if (
                        !["http:", "https:"].includes(avatarUrl.protocol) ||
                        !avatarUrl.hostname
                    ) {
                        throw new Error("Invalid avatar URL");
                    }
                } catch {
                    return res.status(400).json({
                        success: false,
                        message: "Avatar must be a valid HTTP or HTTPS URL"
                    });
                }
            }

            user.avatar = cleanAvatar;
        }

        // Save through the document so schema validation runs.
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar || "",
                emailVerified: user.emailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyProfile,
    updateMyProfile
};
