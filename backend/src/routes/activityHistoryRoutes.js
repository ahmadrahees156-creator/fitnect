
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getActivityHistory,
} = require("../controllers/activityHistoryController");

router.use(protect);

router.get("/", getActivityHistory);

module.exports = router;
