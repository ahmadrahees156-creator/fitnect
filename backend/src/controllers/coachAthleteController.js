
const mongoose = require("mongoose");
const User = require("../models/User");
const CoachAthlete = require("../models/CoachAthlete");

exports.requestAthlete = async (req, res, next) => {
  try {
    const coachId = req.user.id;
    const { athleteId } = req.params;

    if (!mongoose.isValidObjectId(athleteId)) {
      return res.status(400).json({
        message: "Invalid athlete ID",
      });
    }

    if (String(coachId) === String(athleteId)) {
      return res.status(400).json({
        message: "A coach cannot assign themselves as an athlete",
      });
    }

    const [coach, athlete] = await Promise.all([
      User.findById(coachId).select("_id role"),
      User.findById(athleteId).select("_id role"),
    ]);

    if (!coach || coach.role !== "coach") {
      return res.status(403).json({
        message: "Only coach accounts can request athletes",
      });
    }

    if (!athlete || athlete.role !== "athlete") {
      return res.status(404).json({
        message: "Athlete not found",
      });
    }

    const existing = await CoachAthlete.findOne({
      coach: coachId,
      athlete: athleteId,
    });

    if (existing && existing.status !== "rejected") {
      return res.status(409).json({
        message: "A pending or active relationship already exists",
      });
    }

    let assignment;

    if (existing) {
      existing.status = "pending";
      existing.respondedAt = null;
      assignment = await existing.save();
    } else {
      assignment = await CoachAthlete.create({
        coach: coachId,
        athlete: athleteId,
        status: "pending",
      });
    }

    return res.status(201).json({
      message: "Athlete assignment request sent",
      assignment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An assignment request already exists",
      });
    }

    next(error);
  }
};

exports.getIncomingRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "athlete") {
      return res.status(403).json({
        message: "Only athletes can view incoming requests",
      });
    }

    const requests = await CoachAthlete.find({
      athlete: req.user.id,
      status: "pending",
    })
      .populate("coach", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
};

exports.respondToRequest = async (req, res, next) => {
  try {
    if (req.user.role !== "athlete") {
      return res.status(403).json({
        message: "Only athletes can respond to requests",
      });
    }

    const { assignmentId } = req.params;
    const { decision } = req.body;

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        message: "Invalid assignment ID",
      });
    }

    if (!["accept", "reject"].includes(decision)) {
      return res.status(400).json({
        message: "decision must be accept or reject",
      });
    }

    const assignment = await CoachAthlete.findOne({
      _id: assignmentId,
      athlete: req.user.id,
      status: "pending",
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Pending request not found",
      });
    }

    assignment.status =
      decision === "accept" ? "active" : "rejected";

    assignment.respondedAt = new Date();

    await assignment.save();

    return res.status(200).json({
      message:
        decision === "accept"
          ? "Coach relationship activated"
          : "Coach request rejected",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssignedAthletes = async (req, res, next) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({
        message: "Only coaches can view assigned athletes",
      });
    }

    const assignments = await CoachAthlete.find({
      coach: req.user.id,
      status: "active",
    })
      .populate("athlete", "name email role")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: assignments.length,
      athletes: assignments.map((assignment) => ({
        assignmentId: assignment._id,
        assignedAt: assignment.respondedAt,
        athlete: assignment.athlete,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyCoaches = async (req, res, next) => {
  try {
    if (req.user.role !== "athlete") {
      return res.status(403).json({
        message: "Only athletes can view their coaches",
      });
    }

    const assignments = await CoachAthlete.find({
      athlete: req.user.id,
      status: "active",
    })
      .populate("coach", "name email role")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: assignments.length,
      coaches: assignments.map((assignment) => ({
        assignmentId: assignment._id,
        assignedAt: assignment.respondedAt,
        coach: assignment.coach,
      })),
    });
  } catch (error) {
    next(error);
  }
};
