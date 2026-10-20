
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  requestAthlete,
  getIncomingRequests,
  respondToRequest,
  getAssignedAthletes,
  getMyCoaches,
} = require("../controllers/coachAthleteController");

router.use(protect);

router.post("/athletes/:athleteId/request", requestAthlete);

router.get("/requests/incoming", getIncomingRequests);

router.patch(
  "/requests/:assignmentId",
  respondToRequest
);

router.get("/athletes", getAssignedAthletes);

router.get("/coaches", getMyCoaches);

module.exports = router;
