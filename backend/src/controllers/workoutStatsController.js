
const mongoose = require("mongoose");
const Workout = require("../models/Workout");

const getWorkoutStats = async (req, res, next) => {
  try {
    const { period = "week" } = req.query;

    if (!["week", "month", "all"].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Period must be week, month, or all.",
      });
    }

    const now = new Date();

    // Start of today in UTC
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

    // Determine the date range for the requested period
    let startDate = null;

    if (period === "week") {
      startDate = new Date(today);
      startDate.setUTCDate(startDate.getUTCDate() - 6);
    } else if (period === "month") {
      startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      );
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const filter = { user: userId };

    if (startDate) {
      filter.date = {
        $gte: startDate,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Calculate total workouts, total time, and average duration
    const [summaryResult, categoryStats, dailyStats] =
      await Promise.all([
        Workout.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalWorkouts: { $sum: 1 },
              totalDurationMinutes: { $sum: "$durationMinutes" },
              averageDurationMinutes: {
                $avg: "$durationMinutes",
              },
            },
          },
        ]),

        // Group workouts by category
        Workout.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              totalDurationMinutes: {
                $sum: "$durationMinutes",
              },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Activity for the last seven UTC calendar days
        Workout.aggregate([
          {
            $match: {
              user: userId,
              date: {
                $gte: new Date(
                  today.getTime() - 6 * 24 * 60 * 60 * 1000
                ),
                $lt: new Date(
                  today.getTime() + 24 * 60 * 60 * 1000
                ),
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
              workouts: { $sum: 1 },
              durationMinutes: { $sum: "$durationMinutes" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const summary = summaryResult[0] || {
      totalWorkouts: 0,
      totalDurationMinutes: 0,
      averageDurationMinutes: 0,
    };

    // Include days with no workouts as zeroes
    const activityLast7Days = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - i);

      const dateString = day.toISOString().slice(0, 10);

      const existingDay = dailyStats.find(
        (item) => item._id === dateString
      );

      activityLast7Days.push({
        date: dateString,
        workouts: existingDay ? existingDay.workouts : 0,
        durationMinutes: existingDay
          ? existingDay.durationMinutes
          : 0,
      });
    }

    return res.status(200).json({
      success: true,
      period,
      summary: {
        totalWorkouts: summary.totalWorkouts,
        totalDurationMinutes: summary.totalDurationMinutes,
        averageDurationMinutes: Number(
          summary.averageDurationMinutes.toFixed(1)
        ),
      },
      categoryBreakdown: categoryStats.map((item) => ({
        category: item._id,
        workouts: item.count,
        durationMinutes: item.totalDurationMinutes,
      })),
      activityLast7Days,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkoutStats };
