
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  addHydration,
  getTodayHydration,
  getHydrationHistory,
} = require("../controllers/hydrationController");

router.use(protect);

router.post("/", addHydration);
router.get("/today", getTodayHydration);
router.get("/history", getHydrationHistory);

module.exports = router;
