const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
    saveWellness,
    getTodayWellness,
    getWellnessHistory
} = require("../controllers/wellnessController");

const router = express.Router();

router.use(protect);

router.post("/", saveWellness);
router.get("/today", getTodayWellness);
router.get("/history", getWellnessHistory);

module.exports = router;