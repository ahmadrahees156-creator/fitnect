require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const WorkoutLibrary = require("./models/WorkoutLibrary");
const importWorkouts = require("./scripts/importWorkouts");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        try {
            const workoutCount = await WorkoutLibrary.countDocuments();
            if (workoutCount === 0) {
                console.log("Workout library is empty. Seeding initial exercises...");
                await importWorkouts();
            }
        } catch (seedErr) {
            console.warn("Could not check/seed workout library on startup:", seedErr.message);
        }

        app.listen(PORT, () => {
            console.log(`FitNect API running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start FitNect:", error.message);
        process.exitCode = 1;
    }
}

startServer();
