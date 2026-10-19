
const mongoose = require("mongoose");
const Hydration = require("../models/Hydration");

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

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

const getUserObjectId = (req) =>
  new mongoose.Types.ObjectId(req.user.id);

// POST /api/hydration
const addHydration = async (req, res, next) => {
  try {
    const {
      date,
      amountMl,
      beverageType = "water",
      notes = "",
    } = req.body;

    if (
      typeof amountMl !== "number" ||
      !Number.isFinite(amountMl) ||
      amountMl < 1 ||
      amountMl > 20000
    ) {
      return res.status(400).json({
        success: false,
        message: "amountMl must be a number between 1 and 20000.",
      });
    }

    const intakeDate = getDateOnly(date);
    const today = getDateOnly();

    if (!intakeDate) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format.",
      });
    }

    if (intakeDate > today) {
      return res.status(400).json({
        success: false,
        message: "Hydration date cannot be in the future.",
      });
    }

    const allowedTypes = [
      "water",
      "electrolyte",
      "milk",
      "juice",
      "other",
    ];

    if (!allowedTypes.includes(beverageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid beverageType.",
      });
    }

    if (
      typeof notes !== "string" ||
      notes.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Notes must be text with at most 200 characters.",
      });
    }

    const entry = await Hydration.create({
      user: getUserObjectId(req),
      date: intakeDate,
      amountMl,
      beverageType,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Hydration entry saved successfully.",
      entry,
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

// GET /api/hydration/today
const getTodayHydration = async (req, res, next) => {
  try {
    const today = getDateOnly();
    const tomorrow = new Date(
      today.getTime() + 24 * 60 * 60 * 1000
    );

    const user = getUserObjectId(req);

    const [entries, totals] = await Promise.all([
      Hydration.find({
        user,
        date: { $gte: today, $lt: tomorrow },
      }).sort({ createdAt: -1 }),

      Hydration.aggregate([
        {
          $match: {
            user,
            date: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: null,
            totalMl: { $sum: "$amountMl" },
            entryCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = totals[0] || {
      totalMl: 0,
      entryCount: 0,
    };

    return res.status(200).json({
      success: true,
      date: today.toISOString().slice(0, 10),
      totalMl: summary.totalMl,
      entryCount: summary.entryCount,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hydration/history?days=7
const getHydrationHistory = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);

    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "days must be an integer between 1 and 90.",
      });
    }

    const today = getDateOnly();
    const startDate = new Date(today);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    const dailyTotals = await Hydration.aggregate([
      {
        $match: {
          user: getUserObjectId(req),
          date: {
            $gte: startDate,
            $lt: new Date(today.getTime() + 86400000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "UTC",
            },
          },
          totalMl: { $sum: "$amountMl" },
          entryCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const history = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - i);

      const dateString = day.toISOString().slice(0, 10);
      const record = dailyTotals.find(
        (item) => item._id === dateString
      );

      history.push({
        date: dateString,
        totalMl: record ? record.totalMl : 0,
        entryCount: record ? record.entryCount : 0,
      });
    }

    return res.status(200).json({
      success: true,
      days,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addHydration,
  getTodayHydration,
  getHydrationHistory,
};
