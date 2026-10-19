const WellnessCheckIn = require("../models/WellnessCheckIn");

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

        const [todayWellness, weeklyRecords] = await Promise.all([
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
                .lean()
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
                    available: false,
                    message: "Workout tracking has not been implemented yet"
                },

                nutrition: {
                    available: false,
                    message: "Nutrition tracking has not been implemented yet"
                },

                recovery: {
                    available: false,
                    message: "Recovery tracking has not been implemented yet"
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getDashboardSummary };