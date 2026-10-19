
const mongoose = require("mongoose");

const Workout = require("../models/Workout");
const WellnessCheckIn = require("../models/WellnessCheckIn");
const Hydration = require("../models/Hydration");
const Nutrition = require("../models/Nutrition");

const DAY_MS = 24 * 60 * 60 * 1000;

function getDateRange(days) {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);

  const start = new Date(
    end.getTime() - (days - 1) * DAY_MS
  );

  const exclusiveEnd = new Date(end.getTime() + DAY_MS);

  return { start, end: exclusiveEnd };
}

function dailyPipeline(userId, start, end, groupFields) {
  return [
    {
      $match: {
        user: userId,
        date: { $gte: start, $lt: end },
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
        ...groupFields,
      },
    },
    { $sort: { _id: 1 } },
  ];
}

function round(value) {
  return Math.round((value || 0) * 100) / 100;
}

exports.getActivityHistory = async (req, res, next) => {
  try {
    const rawDays = req.query.days ?? "7";
    const days = Number(rawDays);

    if (
      !/^\d+$/.test(String(rawDays)) ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 90
    ) {
      return res.status(400).json({
        message: "days must be an integer between 1 and 90",
      });
    }

    if (!mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        message: "Invalid authenticated user",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { start, end } = getDateRange(days);

    const [
      workouts,
      recovery,
      hydration,
      nutrition,
    ] = await Promise.all([
      Workout.aggregate(
        dailyPipeline(userId, start, end, {
          workoutCount: { $sum: 1 },
          workoutMinutes: { $sum: "$durationMinutes" },
        })
      ),

      WellnessCheckIn.aggregate(
        dailyPipeline(userId, start, end, {
          checkInCount: { $sum: 1 },
          averageEnergy: { $avg: "$energy" },
          averageSleepHours: { $avg: "$sleepHours" },
          averageStress: { $avg: "$stress" },
          averageSoreness: { $avg: "$soreness" },
        })
      ),

      Hydration.aggregate(
        dailyPipeline(userId, start, end, {
          hydrationEntryCount: { $sum: 1 },
          totalMl: { $sum: "$amountMl" },
        })
      ),

      Nutrition.aggregate(
        dailyPipeline(userId, start, end, {
          nutritionEntryCount: { $sum: 1 },
          caloriesKcal: { $sum: "$calories" },
          proteinG: { $sum: "$protein" },
          carbohydratesG: { $sum: "$carbohydrates" },
          fatG: { $sum: "$fat" },
        })
      ),
    ]);

    const toDateMap = (records) =>
      new Map(records.map((record) => [record._id, record]));

    const workoutMap = toDateMap(workouts);
    const recoveryMap = toDateMap(recovery);
    const hydrationMap = toDateMap(hydration);
    const nutritionMap = toDateMap(nutrition);

    const history = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(
        start.getTime() + i * DAY_MS
      );
      const dateKey = currentDate.toISOString().slice(0, 10);

      const w = workoutMap.get(dateKey) || {};
      const r = recoveryMap.get(dateKey) || {};
      const h = hydrationMap.get(dateKey) || {};
      const n = nutritionMap.get(dateKey) || {};

      history.push({
        date: dateKey,

        workout: {
          count: w.workoutCount || 0,
          durationMinutes: round(w.workoutMinutes),
        },

        recovery: {
          checkInCount: r.checkInCount || 0,
          averageEnergy: round(r.averageEnergy),
          averageSleepHours: round(r.averageSleepHours),
          averageStress: round(r.averageStress),
          averageSoreness: round(r.averageSoreness),
        },

        hydration: {
          entryCount: h.hydrationEntryCount || 0,
          totalMl: round(h.totalMl),
        },

        nutrition: {
          entryCount: n.nutritionEntryCount || 0,
          caloriesKcal: round(n.caloriesKcal),
          proteinG: round(n.proteinG),
          carbohydratesG: round(n.carbohydratesG),
          fatG: round(n.fatG),
        },
      });
    }

    return res.status(200).json({
      days,
      startDate: start.toISOString().slice(0, 10),
      endDate: new Date(end.getTime() - DAY_MS)
        .toISOString()
        .slice(0, 10),
      history,
    });
  } catch (error) {
    next(error);
  }
};
