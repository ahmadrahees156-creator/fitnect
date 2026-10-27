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

  return requestNutritionApi("/nutrition-targets", {
    method: "POST",
    body: JSON.stringify({
      age: profile.age,
      sex: profile.sex,
      weight: profile.weightKg,
      height: profile.heightCm,
      goal,
      activity_level
    })
  });
}

module.exports = {
  searchFoods,
  getFoodNutrition,
  getMealSummary,
  getNutritionTargets
};
