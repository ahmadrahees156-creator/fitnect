
const mongoose = require("mongoose");
const NutritionGoal = require("../models/NutritionGoal");
const Nutrition = require("../models/Nutrition");

const goalFields = {
  caloriesKcal: { min: 1, max: 100000 },
  proteinG: { min: 0, max: 10000 },
  carbohydratesG: { min: 0, max: 10000 },
  fatG: { min: 0, max: 10000 },
};

function validateGoals(body) {
  for (const [field, limits] of Object.entries(goalFields)) {
    const value = body[field];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < limits.min ||
      value > limits.max
    ) {
      return `${field} must be a number between ${limits.min} and ${limits.max}`;
    }
  }

  return null;
}

function getTodayRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

exports.getGoals = async (req, res, next) => {
  try {
    const goals = await NutritionGoal.findOne({
      user: req.user.id,
    }).select("-__v");

    return res.status(200).json({ goals });
  } catch (error) {
    next(error);
  }
};

exports.saveGoals = async (req, res, next) => {
  try {
    const validationError = validateGoals(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const goals = await NutritionGoal.findOneAndUpdate(
      { user: req.user.id },
      {
        user: new mongoose.Types.ObjectId(req.user.id),
        caloriesKcal: req.body.caloriesKcal,
        proteinG: req.body.proteinG,
        carbohydratesG: req.body.carbohydratesG,
        fatG: req.body.fatG,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).select("-__v");

    return res.status(200).json({
      message: "Nutrition goals saved",
      goals,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodayProgress = async (req, res, next) => {
  try {
    const goals = await NutritionGoal.findOne({
      user: req.user.id,
    }).select("-__v");

    const { start, end } = getTodayRange();

    const totals = await Nutrition.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          caloriesKcal: { $sum: "$calories" },
          proteinG: { $sum: "$protein" },
          carbohydratesG: { $sum: "$carbohydrates" },
          fatG: { $sum: "$fat" },
        },
      },
    ]);

    const consumed = totals[0] || {
      caloriesKcal: 0,
      proteinG: 0,
      carbohydratesG: 0,
      fatG: 0,
    };

    const progress = goals
      ? {
          caloriesPercent: Math.round(
            (consumed.caloriesKcal / goals.caloriesKcal) * 100
          ),
          proteinPercent: goals.proteinG > 0
            ? Math.round((consumed.proteinG / goals.proteinG) * 100)
            : null,
          carbohydratesPercent: goals.carbohydratesG > 0
            ? Math.round(
                (consumed.carbohydratesG / goals.carbohydratesG) * 100
              )
            : null,
          fatPercent: goals.fatG > 0
            ? Math.round((consumed.fatG / goals.fatG) * 100)
            : null,
        }
      : null;

    return res.status(200).json({
      date: start.toISOString().slice(0, 10),
      goals,
      consumed,
      progress,
      message: goals
        ? undefined
        : "Set nutrition goals to calculate progress",
    });
  } catch (error) {
    next(error);
  }
};
