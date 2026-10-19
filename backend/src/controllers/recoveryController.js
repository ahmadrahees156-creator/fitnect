
const WellnessCheckIn = require("../models/WellnessCheckIn");

const getDateOnly = (value) => {
  if (!value) {
    const now = new Date();

    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

// POST /api/recovery
const saveRecovery = async (req, res, next) => {
  try {
    const {
      date,
      mood,
      energy,
      sleepHours,
      sleepQuality,
      stress,
      soreness,
      notes,
    } = req.body;

    const checkInDate = getDateOnly(date);

    if (!checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format.",
      });
    }

    const today = getDateOnly();

    if (checkInDate > today) {
      return res.status(400).json({
        success: false,
        message: "Recovery date cannot be in the future.",
      });
    }

    if (
      !mood ||
      energy === undefined ||
      sleepHours === undefined ||
      !sleepQuality ||
      stress === undefined ||
      soreness === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mood, energy, sleep hours, sleep quality, stress, and soreness are required.",
      });
    }

    const recovery = await WellnessCheckIn.findOneAndUpdate(
      {
        user: req.user.id,
        date: checkInDate,
      },
      {
        $set: {
          mood,
          energy,
          sleepHours,
          sleepQuality,
          stress,
          soreness,
          notes: notes || "",
        },
        $setOnInsert: {
          user: req.user.id,
          date: checkInDate,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Recovery check-in saved successfully.",
      recovery,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// GET /api/recovery/today
const getTodayRecovery = async (req, res, next) => {
  try {
    const today = getDateOnly();

    const recovery = await WellnessCheckIn.findOne({
      user: req.user.id,
      date: today,
    });

    return res.status(200).json({
      success: true,
      recovery: recovery || null,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recovery/history?limit=30
const getRecoveryHistory = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 30);

    if (!Number.isInteger(limit) || limit < 1 || limit > 90) {
      return res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 90.",
      });
    }

    const recovery = await WellnessCheckIn.find({
      user: req.user.id,
    })
      .sort({ date: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: recovery.length,
      recovery,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveRecovery,
  getTodayRecovery,
  getRecoveryHistory,
};
