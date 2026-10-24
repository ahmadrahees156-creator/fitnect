const express = require("express");

const {
  searchFoods,
  getFoodById,
} = require("../controllers/foodController");

const router = express.Router();

// Search the food catalogue
router.get("/", searchFoods);

// Get one food using its USDA ID
router.get("/:fdcId", getFoodById);

module.exports = router;