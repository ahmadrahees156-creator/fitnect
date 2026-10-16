
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 60
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },

        password: {
            type: String,
            select: false,
            minlength: 8,
            maxlength: 72
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true
        },

        avatar: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["athlete", "coach"],
            default: "athlete",
            required: true
        },
        emailVerified: {
            type: Boolean,
            default: false,
            required: true
        }
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidatePassword) {
    if (!this.password) {
        return Promise.resolve(false);
    }

    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
