
const {
  getFitnessRecommendations
} = require("../services/fitnessRecommendationService");

async function getMyFitnessRecommendations(req, res) {
  try {
    const userId = req.user.id || req.user._id;

    const recommendations = await getFitnessRecommendations(userId);

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error("Fitness recommendation error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 404
          ? error.message
          : "Unable to generate fitness recommendations."
    });
  }
}

module.exports = {
  getMyFitnessRecommendations
};
