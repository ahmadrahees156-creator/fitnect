const FitnessProfile = require("../models/FitnessProfile");
const nutritionApi = require("../services/nutritionApiService");

exports.searchFoods = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();

    if (search.length < 2 || search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search must contain between 2 and 100 characters."
      });
    }

    const data = await nutritionApi.searchFoods(search);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getFoodNutrition = async (req, res, next) => {
  try {
    const fdcId = req.query.fdc_id;

    if (!fdcId || !/^\d+$/.test(String(fdcId))) {
      return res.status(400).json({
        success: false,
        message: "A valid numeric fdc_id is required."
      });
    }

    const data = await nutritionApi.getFoodNutrition(fdcId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getMealSummary = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one food item."
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 100 food items is allowed."
      });
    }

    const validItems = items.every((item) => {
      return (
        item &&
        /^\d+$/.test(String(item.fdc_id)) &&
        Number.isFinite(Number(item.grams)) &&
        Number(item.grams) > 0 &&
        Number(item.grams) <= 10000
      );
    });

    if (!validItems) {
      return res.status(400).json({
        success: false,
        message: "Every item needs a valid fdc_id and grams greater than 0."
      });
    }

    const cleanItems = items.map((item) => ({
      fdc_id: Number(item.fdc_id),
      grams: Number(item.grams)
    }));

    const data = await nutritionApi.getMealSummary(cleanItems);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getNutritionTargets = async (req, res, next) => {
  try {
    const profile = await FitnessProfile.findOne({
      user: req.user.id
    });

    if (!profile || !profile.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        message: "Complete your fitness profile before requesting nutrition targets."
      });
    }

    // Sex must be explicitly saved in the user's profile.
    if (!profile.sex) {
      return res.status(400).json({
        success: false,
        message: "Please add your sex to your fitness profile before requesting nutrition targets."
      });
    }

    if (
      !profile.age ||
      !profile.weightKg ||
      !profile.heightCm ||
      !profile.goal ||
      !profile.activityLevel
    ) {
      return res.status(400).json({
        success: false,
        message: "Your fitness profile is missing required nutrition information."
      });
    }

    const data = await nutritionApi.getNutritionTargets(profile);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};