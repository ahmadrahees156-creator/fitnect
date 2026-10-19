const WellnessCheckIn = require("../models/WellnessCheckIn");

// GET /api/insights
async function getInsights(req, res, next) {
    try {
        const latest = await WellnessCheckIn.findOne({
            user: req.user.id
        })
            .sort({ date: -1 })
            .lean();

        const insights = [];

        if (!latest) {
            insights.push({
                type: "wellness",
                title: "Start with a wellness check-in",
                message: "Record your sleep, energy, mood, stress, and soreness to begin tracking your personal trends."
            });

            return res.status(200).json({
                success: true,
                source: "rule-based",
                generatedAt: new Date().toISOString(),
                insights
            });
        }

        if (latest.sleepHours < 7) {
            insights.push({
                type: "sleep",
                title: "Review your sleep",
                message: "You recorded less than 7 hours of sleep. Consider whether an earlier bedtime or a more consistent sleep schedule could help."
            });
        }

        if (latest.energy <= 3) {
            insights.push({
                type: "energy",
                title: "Your energy is low",
                message: "You reported low energy. Consider how rest, meals, hydration, and your workload may be affecting you."
            });
        }

        if (latest.stress >= 4) {
            insights.push({
                type: "stress",
                title: "Make space to unwind",
                message: "You reported elevated stress. Consider a relaxing break and review what may be contributing to it."
            });
        }

        if (latest.soreness >= 4) {
            insights.push({
                type: "soreness",
                title: "Pay attention to soreness",
                message: "You reported high soreness. Consider reducing strenuous activity until you feel better. Persistent or severe pain should be assessed by a healthcare professional."
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: "general",
                title: "Keep tracking your wellbeing",
                message: "No alert was triggered by these basic rules. Keep recording your check-ins to understand your trends over time."
            });
        }

        return res.status(200).json({
            success: true,
            source: "rule-based",
            basedOnDate: latest.date.toISOString().slice(0, 10),
            generatedAt: new Date().toISOString(),
            insights
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getInsights };