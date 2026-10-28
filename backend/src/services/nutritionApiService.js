const BASE_URL = (process.env.NUTRITION_SERVICE_URL || "https://fitnect-nutrition.onrender.com").replace(/\/+$/, "");

async function requestNutritionApi(path, options = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      },
      signal: AbortSignal.timeout(35000)
    });
  } catch (error) {
    const serviceError = new Error(
      "Nutrition service is unavailable. Please try again."
    );
    serviceError.statusCode = 503;
    throw serviceError;
  }

  const text = await response.text();
  let result;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = null;
  }

  if (!response.ok) {
    const serviceError = new Error(
      result?.message ||
      result?.error ||
      `Nutrition service returned status ${response.status}.`
    );

    serviceError.statusCode =
      response.status >= 500 ? 502 : response.status;

    throw serviceError;
  }

  if (result === null) {
    const serviceError = new Error(
      "Nutrition service returned an invalid response."
    );
    serviceError.statusCode = 502;
    throw serviceError;
  }

  return result;
}

async function searchFoods(search) {
  const query = new URLSearchParams({ search });
  return requestNutritionApi(`/foods?${query.toString()}`);
}

async function getFoodNutrition(fdcId) {
  const query = new URLSearchParams({ fdc_id: String(fdcId) });
  return requestNutritionApi(`/nutrition?${query.toString()}`);
}

async function getMealSummary(items) {
  return requestNutritionApi("/meal-summary", {
    method: "POST",
    body: JSON.stringify({ items })
  });
}

async function getNutritionTargets(profile) {
  const goalMap = {
    strength: "build strength",
    weight_gain: "build strength",
    weight_management: "loss weight",
    endurance: "improve endurance",
    general_fitness: "improve endurance"
  };

  const activityMap = {
    sedentary: "sedentary",
    light: "light",
    moderate: "moderate",
    high: "very_active"
  };

  const goal = goalMap[profile.goal] || "build strength";
  const activity_level = activityMap[profile.activityLevel] || "moderate";

  const raw = await requestNutritionApi("/nutrition-targets", {
    method: "POST",
    body: JSON.stringify({
      age: Number(profile.age),
      sex: profile.sex,
      weight: Number(profile.weightKg),
      height: Number(profile.heightCm),
      goal,
      activity_level
    })
  });

  // Normalize the external service's response into one stable API contract.
  // Services often wrap values in data/targets objects or use unit suffixes.
  const normalizeKey = (key) => String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
  const findNumeric = (object, aliases, depth = 0) => {
    if (!object || typeof object !== "object" || depth > 8) return undefined;
    const accepted = aliases.map(normalizeKey);
    if (Array.isArray(object)) {
      for (const item of object) {
        const found = findNumeric(item, aliases, depth + 1);
        if (found !== undefined) return found;
      }
      return undefined;
    }

    for (const [key, value] of Object.entries(object)) {
      if (!accepted.includes(normalizeKey(key))) continue;
      const candidate = value && typeof value === "object"
        ? value.value ?? value.amount ?? value.target
        : value;
      if (candidate !== "" && candidate !== null && candidate !== undefined && Number.isFinite(Number(candidate))) {
        return Number(candidate);
      }
    }

    for (const value of Object.values(object)) {
      const found = findNumeric(value, aliases, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  };

  const caloriesKcal = findNumeric(raw, [
    "caloriesKcal", "calories_kcal", "calories", "calorie", "calorie_target",
    "daily_calories", "daily_calorie_target", "energy_kcal", "energy",
    "tdee", "calorie_needs", "target_calories", "calories_per_day"
  ]);
  let proteinG = findNumeric(raw, [
    "proteinG", "protein_g", "protein", "protein_grams", "protein_target",
    "daily_protein", "target_protein"
  ]);
  let carbohydratesG = findNumeric(raw, [
    "carbohydratesG", "carbohydrates_g", "carbohydrates", "carbohydrate",
    "carbs", "carbs_g", "carbohydrate_g", "carbohydrate_grams",
    "carbohydrate_target", "daily_carbs", "target_carbs"
  ]);
  let fatG = findNumeric(raw, [
    "fatG", "fat_g", "fat", "fat_grams", "fat_target", "daily_fat", "target_fat"
  ]);

  if (!Number.isFinite(caloriesKcal) || caloriesKcal <= 0) {
    const error = new Error("Nutrition service did not return a valid daily calorie target.");
    error.statusCode = 502;
    throw error;
  }

  // If the external service provides calories but omits macros, derive the
  // missing values using transparent defaults based on body weight and calories.
  // Preserve any macro values explicitly supplied by the service.
  if (!Number.isFinite(proteinG) || proteinG <= 0) {
    const proteinFactor = ["strength", "weight_gain"].includes(profile.goal) ? 1.8 : 1.6;
    proteinG = Math.round(Number(profile.weightKg) * proteinFactor);
  }
  if (!Number.isFinite(fatG) || fatG <= 0) {
    fatG = Math.round((caloriesKcal * 0.25) / 9);
  }
  if (!Number.isFinite(carbohydratesG) || carbohydratesG <= 0) {
    carbohydratesG = Math.round(Math.max(0, caloriesKcal - proteinG * 4 - fatG * 9) / 4);
  }

  const targets = { caloriesKcal, proteinG, carbohydratesG, fatG };
  if (Object.values(targets).some((value) => !Number.isFinite(value) || value <= 0)) {
    const error = new Error("Nutrition service returned incomplete daily nutrition targets.");
    error.statusCode = 502;
    throw error;
  }

  return {
    ...targets,
    source: "nutrition-service",
    macrosEstimated: !Number.isFinite(findNumeric(raw, ["proteinG", "protein_g", "protein", "protein_grams", "protein_target", "daily_protein", "target_protein"])) ||
      !Number.isFinite(findNumeric(raw, ["carbohydratesG", "carbohydrates_g", "carbohydrates", "carbohydrate", "carbs", "carbs_g", "carbohydrate_g", "carbohydrate_grams", "carbohydrate_target", "daily_carbs", "target_carbs"])) ||
      !Number.isFinite(findNumeric(raw, ["fatG", "fat_g", "fat", "fat_grams", "fat_target", "daily_fat", "target_fat"]))
  };
}

module.exports = {
  searchFoods,
  getFoodNutrition,
  getMealSummary,
  getNutritionTargets
};
