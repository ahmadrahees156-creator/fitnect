const FitnessProfile = require("../models/FitnessProfile");

function getBmiCategory(age, bmi) {
  if (age < 20) {
    return "age_specific_assessment_required";
  }

  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy_weight_range";
  if (bmi < 30) return "overweight";
  return "obesity_range";
}

exports.getMyFitnessProfile = async (req, res, next) => {
  try {
    const profile = await FitnessProfile.findOne({
      user: req.user.id
    });

    if (!profile) {
      return res.status(200).json({
        success: true,
        onboardingCompleted: false,
        profile: null
      });
    }

    return res.status(200).json({
      success: true,
      onboardingCompleted: profile.onboardingCompleted,
      profile: {
        age: profile.age,
        sex: profile.sex,
        gender: profile.gender || profile.sex || "prefer_not_to_say",
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bmi: profile.bmi,
        bmiCategory: getBmiCategory(profile.age, profile.bmi),
        goal: profile.goal,
        activityLevel: profile.activityLevel,
        experienceLevel: profile.experienceLevel,
        workoutLocation: profile.workoutLocation,
        dietaryPreference: profile.dietaryPreference,
        onboardingCompleted: profile.onboardingCompleted,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.saveMyFitnessProfile = async (req, res, next) => {
  try {
    const {
      age,
      sex,
      gender,
      heightCm,
      weightKg,
      goal,
      activityLevel,
      experienceLevel,
      workoutLocation,
      dietaryPreference
    } = req.body;

    // Accept either field name while clients migrate between sex and gender.
    const profileSex = sex || ((gender === "female" || gender === "male") ? gender : undefined);
    const profileGender = gender || ((sex === "female" || sex === "male") ? sex : "prefer_not_to_say");

    const requiredFields = {
      age,
      sex: profileSex,
      heightCm,
      weightKg,
      goal,
      activityLevel,
      experienceLevel,
      workoutLocation,
      dietaryPreference
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) =>
        value === undefined || value === null || value === ""
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fitness profile fields, including sex.",
        missingFields
      });
    }

    // Validate sex values
    if (profileSex !== "female" && profileSex !== "male") {
      return res.status(400).json({
        success: false,
        message: "Sex must be either 'female' or 'male'."
      });
    }

    const numericAge = Number(age);
    const numericHeight = Number(heightCm);
    const numericWeight = Number(weightKg);

    if (
      !Number.isFinite(numericAge) ||
      !Number.isFinite(numericHeight) ||
      !Number.isFinite(numericWeight)
    ) {
      return res.status(400).json({
        success: false,
        message: "Age, height and weight must be valid numbers."
      });
    }

    if (
      !Number.isInteger(numericAge) ||
      numericAge < 13 ||
      numericAge > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "Age must be a whole number between 13 and 120."
      });
    }

    if (numericHeight < 80 || numericHeight > 250) {
      return res.status(400).json({
        success: false,
        message: "Height must be between 80 and 250 cm."
      });
    }

    if (numericWeight < 20 || numericWeight > 500) {
      return res.status(400).json({
        success: false,
        message: "Weight must be between 20 and 500 kg."
      });
    }

    const bmi = Number(
      (numericWeight / Math.pow(numericHeight / 100, 2)).toFixed(1)
    );

    const profileData = {
      age: numericAge,
      gender: ["female", "male", "non_binary", "prefer_not_to_say"].includes(gender) ? gender : "prefer_not_to_say",
      heightCm: numericHeight,
      weightKg: numericWeight,
      bmi,
      sex: profileSex,
      gender: profileGender,
      goal,
      activityLevel,
      experienceLevel,
      workoutLocation,
      dietaryPreference,
      onboardingCompleted: true
    };

    let profile = await FitnessProfile.findOne({
      user: req.user.id
    });

    if (profile) {
      Object.assign(profile, profileData);
    } else {
      profile = new FitnessProfile({
        ...profileData,
        user: req.user.id
      });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Fitness profile saved successfully.",
      onboardingCompleted: profile.onboardingCompleted,
      profile: {
        age: profile.age,
        sex: profile.sex,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bmi: profile.bmi,
        bmiCategory: getBmiCategory(profile.age, profile.bmi),
        goal: profile.goal,
        activityLevel: profile.activityLevel,
        experienceLevel: profile.experienceLevel,
        workoutLocation: profile.workoutLocation,
        dietaryPreference: profile.dietaryPreference,
        onboardingCompleted: profile.onboardingCompleted,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};