
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  saveRecovery,
  getTodayRecovery,
  getRecoveryHistory,
} = require("../controllers/recoveryController");

router.use(protect);

router.post("/", saveRecovery);
router.get("/today", getTodayRecovery);
router.get("/history", getRecoveryHistory);

module.exports = router;
