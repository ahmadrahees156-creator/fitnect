const WellnessCheckIn = require("../models/WellnessCheckIn");
const Workout = require("../models/Workout");
const Nutrition = require("../models/Nutrition");

// GET /api/dashboard/summary
async function getDashboardSummary(req, res, next) {
    try {
        const now = new Date();

        const today = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));

        const tomorrow = new Date(
            today.getTime() + 24 * 60 * 60 * 1000
        );

        const weekStart = new Date(
            today.getTime() - 6 * 24 * 60 * 60 * 1000
        );

        const [todayWellness, weeklyRecords, todayWorkouts, workoutsLast7Days, todayNutrition] =
            await Promise.all([
                WellnessCheckIn.findOne({
                    user: req.user.id,
                    date: today
                }).lean(),

                WellnessCheckIn.find({
                    user: req.user.id,
                    date: {
                        $gte: weekStart,
                        $lt: tomorrow
                    }
                })
                    .sort({ date: 1 })
                    .lean(),

                Workout.find({
                    user: req.user.id,
                    date: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }).lean(),

                Workout.countDocuments({
                    user: req.user.id,
                    date: {
                        $gte: weekStart,
                        $lt: tomorrow
                    }
                }),

                Nutrition.find({
                    user: req.user.id,
                    date: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }).lean()
            ]);

        const count = weeklyRecords.length;

        const average = (field) => {
            if (!count) return null;

            const total = weeklyRecords.reduce(
                (sum, record) => sum + record[field],
                0
            );

            return Math.round((total / count) * 10) / 10;
        };

        const todayNutritionTotals = todayNutrition.reduce(
            (acc, item) => ({
                caloriesKcal: acc.caloriesKcal + (item.calories || 0),
                proteinG: acc.proteinG + (item.protein || 0),
                carbohydratesG: acc.carbohydratesG + (item.carbohydrates || 0),
                fatG: acc.fatG + (item.fat || 0)
            }),
            { caloriesKcal: 0, proteinG: 0, carbohydratesG: 0, fatG: 0 }
        );

        return res.status(200).json({
            success: true,
            summary: {
                date: today.toISOString().slice(0, 10),

                wellness: {
                    checkedInToday: Boolean(todayWellness),
                    today: todayWellness || null,
                    checkInsLast7Days: count,
                    averageSleepHours: average("sleepHours"),
                    averageEnergy: average("energy"),
                    averageStress: average("stress"),
                    averageSoreness: average("soreness")
                },

                training: {
                    available: true,
                    workoutsToday: todayWorkouts.length,
                    minutesToday: todayWorkouts.reduce(
                        (sum, w) => sum + (w.durationMinutes || 0),
                        0
                    ),
                    workoutsLast7Days
                },

                nutrition: {
                    available: true,
                    entryCountToday: todayNutrition.length,
                    totalsToday: {
                        caloriesKcal: Math.round(todayNutritionTotals.caloriesKcal * 100) / 100,
                        proteinG: Math.round(todayNutritionTotals.proteinG * 100) / 100,
                        carbohydratesG: Math.round(todayNutritionTotals.carbohydratesG * 100) / 100,
                        fatG: Math.round(todayNutritionTotals.fatG * 100) / 100
                    }
                },

                recovery: {
                    available: true,
                    checkedInToday: Boolean(todayWellness),
                    today: todayWellness || null
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getDashboardSummary };
