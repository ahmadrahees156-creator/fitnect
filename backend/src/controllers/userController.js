
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
        const updates = {};

        // Only allow explicitly supported fields.
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
                    message: "Name must be between 2 and 60 characters"
                });
            }

            updates.name = cleanName;
        }

        if (avatar !== undefined) {
            if (typeof avatar !== "string" || avatar.length > 2048) {
                return res.status(400).json({
                    success: false,
                    message: "Avatar must be a string of at most 2048 characters"
                });
            }

            updates.avatar = avatar.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one supported field: name or avatar"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        // Assign only the validated fields.
        Object.assign(user, updates);
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
