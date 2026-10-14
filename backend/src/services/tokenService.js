
const jwt = require("jsonwebtoken");

function createToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

module.exports = { createToken };
