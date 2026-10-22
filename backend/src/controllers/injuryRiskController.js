
const { predictInjuryRisk } = require("../services/injuryRiskService");

const REQUIRED_FIELDS = [
    "heart_rate",
    "stress_level",
    "hydration_level",
    "sleep_quality",
    "recovery_score",
    "step_count",
    "training_load",
    "training_intensity",
    "training_duration",
    "fatigue_index",
    "sport_type",
    "gender",
    "age",
    "bmi",
];

const OPTIONAL_NUMERIC_FIELDS = [
    "cadence",
    "jump_height",
    "playing_surface",
    "body_temperature",
    "gait_speed",
];

const NUMERIC_FIELDS = [
    "heart_rate",
    "stress_level",
    "hydration_level",
    "sleep_quality",
    "recovery_score",
    "step_count",
    "training_load",
    "training_intensity",
    "training_duration",
    "fatigue_index",
    "age",
    "bmi",
    ...OPTIONAL_NUMERIC_FIELDS,
];

const predictMyInjuryRisk = async (req, res, next) => {
    try {
        const data = req.body;

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: "Request body must be a JSON object.",
            });
        }

        const missingFields = REQUIRED_FIELDS.filter(
            (field) =>
                data[field] === undefined ||
                data[field] === null ||
                data[field] === ""
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Required prediction fields are missing.",
                missingFields,
            });
        }

        for (const field of NUMERIC_FIELDS) {
            if (
                data[field] !== undefined &&
                data[field] !== null &&
                data[field] !== ""
            ) {
                const value = data[field];

                if (
                    typeof value !== "number" &&
                    typeof value !== "string"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be numeric.`,
                    });
                }

                if (
                    String(value).trim() === "" ||
                    !Number.isFinite(Number(value))
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be a valid finite number.`,
                    });
                }
            }
        }

        const sportTypes = ["Basketball", "Other", "Soccer", "Track"];
        const genderTypes = ["Male", "Female"];

        if (!sportTypes.includes(data.sport_type)) {
            return res.status(400).json({
                success: false,
                message: `sport_type must be one of: ${sportTypes.join(", ")}.`,
            });
        }

        if (!genderTypes.includes(data.gender)) {
            return res.status(400).json({
                success: false,
                message: "gender must be Male or Female.",
            });
        }

        const prediction = await predictInjuryRisk(data);

        return res.status(200).json({
            success: true,
            ...prediction,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        next(error);
    }
};

module.exports = { predictMyInjuryRisk };
