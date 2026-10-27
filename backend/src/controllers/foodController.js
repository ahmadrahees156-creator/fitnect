const Food = require("../models/Food");

// GET /api/foods?search=banana&page=1&limit=20
async function searchFoods(req, res, next) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "Page must be at least 1 and limit must be between 1 and 50.",
      });
    }

    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search text cannot exceed 100 characters.",
      });
    }

    // Escape special characters so search text is treated literally.
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = search
      ? { name: { $regex: escapedSearch, $options: "i" } }
      : {};

    const skip = (page - 1) * limit;

    const [foods, total] = await Promise.all([
      Food.find(filter)
        .select(
          "fdcId name category nutritionPer100g defaultServingGrams source sourceUrl"
        )
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Food.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: foods.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: foods,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/foods/:fdcId
async function getFoodById(req, res, next) {
  try {
    const fdcId = Number(req.params.fdcId);

    if (!Number.isSafeInteger(fdcId) || fdcId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid USDA food ID is required.",
      });
    }

    const food = await Food.findOne({ fdcId }).lean();

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchFoods,
  getFoodById,
};