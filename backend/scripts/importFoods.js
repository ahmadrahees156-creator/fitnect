require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { parse } = require("csv-parse/sync");

const connectDB = require("../src/config/db");
const Food = require("../src/models/Food");

const DATA_ROOT = path.join(__dirname, "..", "data");
const BATCH_SIZE = 500;

function findFile(directory, fileName) {
  if (!fs.existsSync(directory)) {
    return null;
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isFile() && entry.name === fileName) {
      return fullPath;
    }

    if (entry.isDirectory()) {
      const result = findFile(fullPath, fileName);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

function readCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: false,
  });
}

function numberOrNull(value) {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

async function importFoods() {
  try {
    const foodPath = findFile(DATA_ROOT, "food.csv");

    if (!foodPath) {
      throw new Error(
        "food.csv not found. Check the extracted USDA dataset."
      );
    }

    const datasetFolder = path.dirname(foodPath);

    const nutrientPath = path.join(
      datasetFolder,
      "food_nutrient.csv"
    );

    const categoryPath = path.join(
      datasetFolder,
      "food_category.csv"
    );

    if (!fs.existsSync(nutrientPath)) {
      throw new Error(
        "food_nutrient.csv was not found beside food.csv."
      );
    }

    console.log("Reading USDA food records...");

    const foodRows = readCsv(foodPath);
    const nutrientRows = readCsv(nutrientPath);

    const categoryRows = fs.existsSync(categoryPath)
      ? readCsv(categoryPath)
      : [];

    console.log("Food rows:", foodRows.length);
    console.log("Nutrient rows:", nutrientRows.length);

    const categories = new Map();

    for (const row of categoryRows) {
      categories.set(
        String(row.id),
        row.description || ""
      );
    }

    const nutrientsByFood = new Map();

    for (const row of nutrientRows) {
      const fdcId = String(row.fdc_id);
      const nutrientId = Number(row.nutrient_id);
      const amount = numberOrNull(row.amount);

      if (amount === null) {
        continue;
      }

      if (!nutrientsByFood.has(fdcId)) {
        nutrientsByFood.set(fdcId, {});
      }

      const nutrients = nutrientsByFood.get(fdcId);

      // Keep the first value if a nutrient appears more than once.
      if (nutrients[nutrientId] === undefined) {
        nutrients[nutrientId] = amount;
      }
    }

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    let batch = [];
    let imported = 0;
    let skipped = 0;

    for (const row of foodRows) {
      const fdcId = Number(row.fdc_id);

      if (!Number.isFinite(fdcId) || !row.description) {
        skipped++;
        continue;
      }

      const nutrientValues =
        nutrientsByFood.get(String(row.fdc_id)) || {};

      // USDA nutrient IDs:
      // 1003 = protein, 1004 = fat,
      // 1005 = carbohydrate, 1008 = energy in kcal,
      // 1079 = fiber.
      const calories =
        nutrientValues[1008] ??
        nutrientValues[2048] ??
        nutrientValues[2047] ??
        null;

      const protein = nutrientValues[1003] ?? null;
      const fat = nutrientValues[1004] ?? null;
      const carbohydrates = nutrientValues[1005] ?? null;
      const fiber = nutrientValues[1079] ?? null;

      const hasUsefulNutrition = [
        calories,
        protein,
        fat,
        carbohydrates,
      ].some((value) => value !== null);

      if (!hasUsefulNutrition) {
        skipped++;
        continue;
      }

      const foodDocument = {
        fdcId,
        name: row.description.trim(),
        dataType: row.data_type || "sr_legacy_food",
        category:
          categories.get(String(row.food_category_id)) || "",
        nutritionPer100g: {
          caloriesKcal: calories,
          proteinG: protein,
          carbohydratesG: carbohydrates,
          fatG: fat,
          fiberG: fiber,
        },
        source: "USDA FoodData Central - SR Legacy",
        sourceUrl: "https://fdc.nal.usda.gov/",
      };

      batch.push({
        updateOne: {
          filter: { fdcId },
          update: { $set: foodDocument },
          upsert: true,
        },
      });

      if (batch.length >= BATCH_SIZE) {
        await Food.bulkWrite(batch, { ordered: false });

        imported += batch.length;
        batch = [];

        console.log("Processed:", imported);
      }
    }

    if (batch.length > 0) {
      await Food.bulkWrite(batch, { ordered: false });
      imported += batch.length;
    }

    console.log("\nFood import completed.");
    console.log("Records processed:", imported);
    console.log("Records skipped:", skipped);

    const totalInDatabase = await Food.countDocuments();

    console.log("Total food records in MongoDB:", totalInDatabase);

    const sample = await Food.findOne({
      fdcId: 167512,
    }).lean();

    if (sample) {
      console.log("\nSample imported food:");
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log(
        "\nSample food 167512 was not imported; check the source records."
      );
    }

    return { imported, skipped, total: totalInDatabase };
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
    }
  }
}

module.exports = importFoods;

if (require.main === module) {
  importFoods().catch((error) => {
    console.error("Food import failed:", error.message);
    process.exitCode = 1;
  });
}
