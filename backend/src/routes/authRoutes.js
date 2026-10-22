
const express = require("express");

const {
    register,
    login,
    verifyEmail,
    resendOTP,
    changePassword,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const { googleLogin } = require("../controllers/googleAuthController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/google", googleLogin);

router.patch("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
