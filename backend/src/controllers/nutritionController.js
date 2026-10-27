const mongoose = require("mongoose");
const Nutrition = require("../models/Nutrition");
const Food = require("../models/Food");
const nutritionApi = require("../services/nutritionApiService");

const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
const servingUnits = ["g", "ml", "piece", "cup", "serving"];

function getDateOnly(value) {
  const dateString =
    value || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateString
  ) {
    return null;
  }

  return date;
}

function getNextDay(date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

exports.addNutrition = async (req, res, next) => {
  try {
    const {
      date,
      foodName,
      mealType,
      servingSize,
      servingUnit,
      calories,
      protein,
      carbohydrates,
      fat,
      notes,
    } = req.body;

    if (
      typeof foodName !== "string" ||
      !foodName.trim() ||
      !mealTypes.includes(mealType)
    ) {
      return res.status(400).json({
        message: "Valid foodName and mealType are required",
      });
    }

    const numericFields = {
      servingSize: { value: servingSize, min: 0.1, max: 10000 },
      calories: { value: calories, min: 0, max: 100000 },
      protein: { value: protein, min: 0, max: 10000 },
      carbohydrates: { value: carbohydrates, min: 0, max: 10000 },
      fat: { value: fat, min: 0, max: 10000 },
    };

    for (const [field, rules] of Object.entries(numericFields)) {
      if (
        typeof rules.value !== "number" ||
        !Number.isFinite(rules.value) ||
        rules.value < rules.min ||
        rules.value > rules.max
      ) {
        return res.status(400).json({
          message: `${field} must be a number between ${rules.min} and ${rules.max}`,
        });
      }
    }

    if (
      servingUnit !== undefined &&
      !servingUnits.includes(servingUnit)
    ) {
      return res.status(400).json({
        message: "Invalid servingUnit",
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 300)
    ) {
      return res.status(400).json({
        message: "Notes must be text with at most 300 characters",
      });
    }

    const entryDate = getDateOnly(date);
    const today = getDateOnly();

    if (
      !entryDate ||
      entryDate.getTime() > today.getTime()
    ) {
      return res.status(400).json({
        message: "Enter a valid date that is not in the future",
      });
    }

    const entry = await Nutrition.create({
      user: new mongoose.Types.ObjectId(req.user.id),
      date: entryDate,
      foodName: foodName.trim(),
      mealType,
      servingSize,
      servingUnit: servingUnit || "serving",
      calories,
      protein,
      carbohydrates,
      fat,
      notes: notes || "",
    });

    return res.status(201).json({
      message: "Nutrition entry saved",
      entry,
    });
  } catch (error) {
    next(error);
  }
};

exports.addFoodFromCatalogue = async (req, res, next) => {
  try {
    const {
      fdcId,
      servingSize,
      mealType,
      date,
      notes,
    } = req.body;

    // Validate the selected catalogue food.
    if (
      typeof fdcId !== "number" ||
      !Number.isSafeInteger(fdcId) ||
      fdcId <= 0
    ) {
      return res.status(400).json({
        message: "A valid numeric fdcId is required",
      });
    }

    // This calculation uses nutrition values per 100 grams.
    if (
      typeof servingSize !== "number" ||
      !Number.isFinite(servingSize) ||
      servingSize < 0.1 ||
      servingSize > 10000
    ) {
      return res.status(400).json({
        message: "servingSize must be between 0.1 and 10000 grams",
      });
    }

    if (!mealTypes.includes(mealType)) {
      return res.status(400).json({
        message: "Valid mealType is required",
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 300)
    ) {
      return res.status(400).json({
        message: "Notes must be text with at most 300 characters",
      });
    }

    const entryDate = getDateOnly(date);
    const today = getDateOnly();

    if (!entryDate || entryDate.getTime() > today.getTime()) {
      return res.status(400).json({
        message: "Enter a valid date that is not in the future",
      });
    }

    // Look up the food in our own catalogue.
    let food = await Food.findOne({ fdcId }).lean();

    if (!food) {
      try {
        const extNutrition = await nutritionApi.getFoodNutrition(fdcId);
        if (Array.isArray(extNutrition) && extNutrition.length > 0) {
          const item = extNutrition[0];
          const gw = Number(item.gram_weight) || 100;
          food = {
            name: item.description,
            nutritionPer100g: {
              caloriesKcal: (Number(item.calories_kcal) / gw) * 100,
              proteinG: (Number(item.protein_g) / gw) * 100,
              carbohydratesG: (Number(item.carbs_g) / gw) * 100,
              fatG: (Number(item.fat_g) / gw) * 100,
            },
          };
        }
      } catch (err) {
        // Fall through to 404
      }
    }

    if (!food) {
      return res.status(404).json({
        message: "Food not found in the catalogue",
      });
    }

    const nutrition = food.nutritionPer100g;

    // Required macro values must exist to calculate the entry.
    const requiredNutrients = [
      nutrition?.caloriesKcal,
      nutrition?.proteinG,
      nutrition?.carbohydratesG,
      nutrition?.fatG,
    ];

    if (
      requiredNutrients.some(
        (value) => typeof value !== "number" || !Number.isFinite(value)
      )
    ) {
      return res.status(422).json({
        message: "Nutrition information is incomplete for this food",
      });
    }

    // Convert the entered quantity into a multiplier of 100 grams.
    const multiplier = servingSize / 100;

    const roundToTwo = (value) =>
      Math.round((value + Number.EPSILON) * 100) / 100;

    const calories = roundToTwo(
      nutrition.caloriesKcal * multiplier
    );
    const protein = roundToTwo(
      nutrition.proteinG * multiplier
    );
    const carbohydrates = roundToTwo(
      nutrition.carbohydratesG * multiplier
    );
    const fat = roundToTwo(
      nutrition.fatG * multiplier
    );

    // Save using the existing Nutrition schema.
    const entry = await Nutrition.create({
      user: new mongoose.Types.ObjectId(req.user.id),
      date: entryDate,
      foodName: food.name,
      mealType,
      servingSize,
      servingUnit: "g",
      calories,
      protein,
      carbohydrates,
      fat,
      notes: notes || "",
    });

    return res.status(201).json({
      message: "Food added to nutrition log",
      entry,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodayNutrition = async (req, res, next) => {
  try {
    const today = getDateOnly();
    const tomorrow = getNextDay(today);

    const entries = await Nutrition.find({
      user: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    }).sort({ createdAt: 1 });

    const totals = entries.reduce(
      (sum, entry) => {
        sum.calories += entry.calories;
        sum.protein += entry.protein;
        sum.carbohydrates += entry.carbohydrates;
        sum.fat += entry.fat;
        return sum;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
    );

    for (const key of Object.keys(totals)) {
      totals[key] = Math.round(totals[key] * 100) / 100;
    }

    return res.status(200).json({
      date: today.toISOString().slice(0, 10),
      entryCount: entries.length,
      totals,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNutritionHistory = async (req, res, next) => {
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

    const today = getDateOnly();
    const startDate = new Date(
      today.getTime() - (days - 1) * 24 * 60 * 60 * 1000
    );
    const endDate = getNextDay(today);

    const results = await Nutrition.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: startDate, $lt: endDate },
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
          entryCount: { $sum: 1 },
          calories: { $sum: "$calories" },
          protein: { $sum: "$protein" },
          carbohydrates: { $sum: "$carbohydrates" },
          fat: { $sum: "$fat" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byDate = new Map(
      results.map((item) => [item._id, item])
    );

    const history = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(
        startDate.getTime() + i * 24 * 60 * 60 * 1000
      );
      const dateKey = date.toISOString().slice(0, 10);
      const item = byDate.get(dateKey);

      history.push({
        date: dateKey,
        entryCount: item?.entryCount || 0,
        calories: Math.round((item?.calories || 0) * 100) / 100,
        protein: Math.round((item?.protein || 0) * 100) / 100,
        carbohydrates:
          Math.round((item?.carbohydrates || 0) * 100) / 100,
        fat: Math.round((item?.fat || 0) * 100) / 100,
      });
    }

    return res.status(200).json({ days, history });
  } catch (error) {
    next(error);
  }
};
