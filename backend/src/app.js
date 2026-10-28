require('dotenv').config(); 
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const wellnessRoutes = require("./routes/wellnessRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const insightsRoutes = require("./routes/insightsRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");
const hydrationRoutes = require("./routes/hydrationRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const nutritionApiRoutes = require("./routes/nutritionApiRoutes");
const nutritionGoalRoutes = require("./routes/nutritionGoalRoutes");
const activityHistoryRoutes = require("./routes/activityHistoryRoutes");
const workoutLibraryRoutes = require("./routes/workoutLibraryRoutes");
const coachAthleteRoutes = require("./routes/coachAthleteRoutes");
const injuryRiskRoutes = require("./routes/injuryRiskRoutes");
const fitnessProfileRoutes = require("./routes/fitnessProfileRoutes");
const foodRoutes = require("./routes/foodRoutes");
const fitnessRecommendationRoutes = require("./routes/fitnessRecommendationRoutes");

const app = express();

// Security and request parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/hydration", hydrationRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/nutrition-api", nutritionApiRoutes);
app.use("/api/nutrition-goals", nutritionGoalRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/activity-history", activityHistoryRoutes);
app.use("/api/workout-library", workoutLibraryRoutes);
app.use("/api/coach-athletes", coachAthleteRoutes);
app.use("/api/injury-risk", injuryRiskRoutes);
app.use("/api/fitness-profile", fitnessProfileRoutes);
app.use("/api/fitness-recommendations", fitnessRecommendationRoutes);
app.use("/api/nutrition-engine", nutritionApiRoutes);
app.use("/api/nutrition-api", nutritionApiRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FitNect backend is running",
        service: "FitNect API"
    });
});

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
