const WellnessCheckIn = require("../models/WellnessCheckIn");

function getDateOnly(value) {
    if (value === undefined || value === null || value === "") {
        const now = new Date();

        return new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));
    }

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
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
}

function getTodayUTC() {
    return getDateOnly();
}

// POST /api/wellness
async function saveWellness(req, res, next) {
    try {
        const {
            date,
            mood,
            energy,
            sleepHours,
            sleepQuality,
            stress,
            soreness,
            notes
        } = req.body;

        const checkInDate = getDateOnly(date);

        if (!checkInDate) {
            return res.status(400).json({
                success: false,
                message: "Date must use YYYY-MM-DD format"
            });
        }

        // Do not allow future-dated check-ins.
        if (checkInDate > getTodayUTC()) {
            return res.status(400).json({
                success: false,
                message: "A future wellness check-in is not allowed"
            });
        }

        if (
            !["great", "good", "okay", "low", "bad"].includes(mood) ||
            !["poor", "fair", "good", "excellent"].includes(sleepQuality)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid mood or sleep quality"
            });
        }

        if (
            !Number.isInteger(energy) ||
            energy < 1 ||
            energy > 10 ||
            !Number.isInteger(stress) ||
            stress < 1 ||
            stress > 5 ||
            !Number.isInteger(soreness) ||
            soreness < 1 ||
            soreness > 5 ||
            typeof sleepHours !== "number" ||
            !Number.isFinite(sleepHours) ||
            sleepHours < 0 ||
            sleepHours > 24 ||
            (notes !== undefined && typeof notes !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid wellness values"
            });
        }

        const wellness = await WellnessCheckIn.findOneAndUpdate(
            {
                user: req.user.id,
                date: checkInDate
            },
            {
                $set: {
                    mood,
                    energy,
                    sleepHours,
                    sleepQuality,
                    stress,
                    soreness,
                    notes: notes || ""
                },
                $setOnInsert: {
                    user: req.user.id,
                    date: checkInDate
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Wellness check-in saved successfully",
            wellness
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/wellness/today
async function getTodayWellness(req, res, next) {
    try {
        const wellness = await WellnessCheckIn.findOne({
            user: req.user.id,
            date: getTodayUTC()
        });

        return res.status(200).json({
            success: true,
            wellness: wellness || null
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/wellness/history?limit=30
async function getWellnessHistory(req, res, next) {
    try {
        const requestedLimit = Number(req.query.limit || 30);

        if (
            !Number.isInteger(requestedLimit) ||
            requestedLimit < 1 ||
            requestedLimit > 90
        ) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 90"
            });
        }

        const wellness = await WellnessCheckIn.find({
            user: req.user.id
        })
            .sort({ date: -1 })
            .limit(requestedLimit)
            .lean();

        return res.status(200).json({
            success: true,
            count: wellness.length,
            wellness
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    saveWellness,
    getTodayWellness,
    getWellnessHistory
};