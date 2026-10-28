const FitnessProfile = require("../models/FitnessProfile");
const WorkoutLibrary = require("../models/WorkoutLibrary");
const Food = require("../models/Food");

function getBmiAssessment(profile) {
  const bmi = Number(profile.bmi);

  if (!Number.isFinite(bmi) || bmi <= 0) {
    return {
      category: "unavailable",
      message: "Complete your height and weight profile first."
    };
  }

  if (profile.age < 20) {
    return {
      category: "age_specific_assessment_required",
      message:
        "BMI for users under 20 requires an age-specific assessment. Recommendations will use your selected goal and fitness preferences."
    };
  }

  if (bmi < 18.5) {
    return {
      category: "underweight",
      message:
        "Consider strength, balanced nutrition and gradual weight gain if appropriate."
    };
  }

  if (bmi < 25) {
    return {
      category: "healthy_weight_range",
      message:
        "Choose recommendations based on your fitness goal and activity level."
    };
  }

  if (bmi < 30) {
    return {
      category: "overweight",
      message:
        "Consider sustainable activity, strength training and balanced nutrition."
    };
  }

  return {
    category: "obesity_range",
    message:
      "Consider adaptable exercise and balanced nutrition. Seek qualified advice for individual health concerns."
  };
}

function getFitnessFocus(profile, assessment) {
  const goal = profile.goal || "general_fitness";

  const focusByGoal = {
    strength: {
      title: "Strength and muscle development",
      categories: ["strength"],
      foodFocus: "protein_and_balanced_nutrition"
    },
    weight_gain: {
      title: "Weight gain and strength",
      categories: ["strength", "flexibility"],
      foodFocus: "energy_and_balanced_nutrition"
    },
    weight_management: {
      title: "Sustainable weight management",
      categories: ["cardio", "strength", "flexibility"],
      foodFocus: "balanced_nutrition"
    },
    endurance: {
      title: "Cardiovascular fitness and endurance",
      categories: ["cardio", "sports"],
      foodFocus: "energy_and_balanced_nutrition"
    },
    general_fitness: {
      title: "General fitness",
      categories: ["strength", "cardio", "flexibility", "yoga"],
      foodFocus: "balanced_nutrition"
    }
  };

  const focus = focusByGoal[goal] || focusByGoal.general_fitness;

  // BMI helps guide the focus, but doesn't erase the user's chosen goal.
  if (
    assessment.category === "underweight" &&
    goal === "weight_management"
  ) {
    return {
      ...focus,
      title: "General fitness and balanced nutrition",
      categories: ["strength", "flexibility"],
      foodFocus: "energy_and_balanced_nutrition"
    };
  }

  return focus;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function workoutMatchesProfile(workout, profile, focus) {
  if (workout.isActive === false) return false;

  const category = normalize(workout.category);

  if (
    focus.categories.length &&
    category &&
    !focus.categories.includes(category)
  ) {
    return false;
  }

  const location = normalize(profile.workoutLocation);

  const equipmentList = Array.isArray(workout.equipment)
    ? workout.equipment.map(normalize)
    : [normalize(workout.equipment)];

  if (location === "home") {
    const isGymOnly = equipmentList.some((eq) =>
      /barbell|cable|machine|leg press|smith machine|bench|e-z curl/i.test(eq)
    );

    if (isGymOnly) return false;
  }

  return true;
}

function rankWorkout(workout, profile) {
  let score = 0;

  const difficulty = normalize(workout.difficulty);
  const level = normalize(profile.experienceLevel);

  if (difficulty && difficulty === level) score += 3;

  const location = normalize(profile.workoutLocation);
  const equipmentList = Array.isArray(workout.equipment)
    ? workout.equipment.map(normalize)
    : [normalize(workout.equipment)];
  const equipmentStr = equipmentList.join(" ");

  if (
    location === "home" &&
    (!equipmentStr ||
      /bodyweight|body only|none|mat|band|bands|dumbbell|kettlebell|foam roll/i.test(
        equipmentStr
      ))
  ) {
    score += 2;
  }

  if ((location === "gym" || location === "both") && equipmentStr) {
    score += 1;
  }

  return score;
}

function foodMatchesPreference(food, preference) {
  const text = `${food.name || ""} ${food.category || ""}`.toLowerCase();

  const meatOrFish =
    /\b(chicken|beef|pork|lamb|turkey|duck|fish|salmon|tuna|shrimp|prawn|crab|lobster|bacon|ham|sausage|meat|anchovy|sardine)\b/;

  const animalDerived =
    /\b(milk|cheese|yogurt|yoghurt|butter|cream|whey|casein|egg|eggs|honey)\b/;

  if (preference === "vegan") {
    return !meatOrFish.test(text) && !animalDerived.test(text);
  }

  if (preference === "vegetarian") {
    return !meatOrFish.test(text);
  }

  if (preference === "non_vegetarian") {
    return true;
  }

  return true;
}

function rankFood(food, focus) {
  const nutrition = food.nutritionPer100g || {};
  let score = 0;

  const protein = Number(nutrition.proteinG || 0);
  const calories = Number(nutrition.caloriesKcal || 0);
  const fiber = Number(nutrition.fiberG || 0);

  if (focus.foodFocus === "protein_and_balanced_nutrition") {
    score += protein;
  } else if (focus.foodFocus === "energy_and_balanced_nutrition") {
    score += Math.min(calories / 10, 30) + protein;
  } else {
    score += fiber * 2 + protein;
  }

  return score;
}

async function getFitnessRecommendations(userId) {
  const profile = await FitnessProfile.findOne({ user: userId }).lean();

  if (!profile || !profile.onboardingCompleted) {
    const error = new Error("Complete your fitness profile to get recommendations.");
    error.statusCode = 404;
    throw error;
  }

  const assessment = getBmiAssessment(profile);
  const focus = getFitnessFocus(profile, assessment);

  const workouts = await WorkoutLibrary.find({ isActive: { $ne: false } })
    .limit(500)
    .lean();

  let recommendedWorkouts = workouts
    .filter((workout) => workoutMatchesProfile(workout, profile, focus))
    .sort((a, b) => rankWorkout(b, profile) - rankWorkout(a, profile))
    .slice(0, 20);

  // If focused matching returned fewer than 5, backfill with other available workouts matching location
  if (recommendedWorkouts.length < 5 && workouts.length > 0) {
    const existingIds = new Set(recommendedWorkouts.map((w) => String(w._id)));
    const backfill = workouts
      .filter((w) => !existingIds.has(String(w._id)) && w.isActive !== false)
      .filter((w) => {
        if (normalize(profile.workoutLocation) === "home") {
          const eqList = Array.isArray(w.equipment)
            ? w.equipment.map(normalize)
            : [normalize(w.equipment)];
          return !eqList.some((eq) =>
            /barbell|cable|machine|leg press|smith machine|bench|e-z curl/i.test(eq)
          );
        }
        return true;
      })
      .sort((a, b) => rankWorkout(b, profile) - rankWorkout(a, profile))
      .slice(0, 20 - recommendedWorkouts.length);

    recommendedWorkouts = recommendedWorkouts.concat(backfill);
  }

  // Only recommend foods with usable nutrition values from the existing catalogue.
  const foods = await Food.find({
    "nutritionPer100g.caloriesKcal": { $exists: true },
    "nutritionPer100g.proteinG": { $exists: true }
  })
    .limit(1000)
    .lean();

  const recommendedFoods = foods
    .filter((food) =>
      foodMatchesPreference(food, profile.dietaryPreference)
    )
    .sort((a, b) => rankFood(b, focus) - rankFood(a, focus))
    .slice(0, 20)
    .map((food) => ({
      fdcId: food.fdcId,
      name: food.name,
      category: food.category,
      servingGrams: 100,
      nutrition: food.nutritionPer100g
    }));

  return {
    profile: {
      bmi: profile.bmi,
      bmiCategory: assessment.category,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      experienceLevel: profile.experienceLevel,
      workoutLocation: profile.workoutLocation,
      dietaryPreference: profile.dietaryPreference
    },
    assessmentMessage: assessment.message,
    fitnessFocus: focus.title,
    workouts: recommendedWorkouts,
    foods: recommendedFoods,
    notes: [
      "Food nutrition is shown per 100 g; adjust values for the actual portion.",
      "Food preference filtering uses name/category keywords when the catalogue lacks verified dietary tags.",
      "BMI is a screening measure, not a medical diagnosis."
    ]
  };
}

module.exports = {
  getBmiAssessment,
  getFitnessFocus,
  getFitnessRecommendations
};
