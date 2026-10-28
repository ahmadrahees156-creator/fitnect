require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const WorkoutLibrary = require("./models/WorkoutLibrary");
const importWorkouts = require("./scripts/importWorkouts");

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

let server;

async function startServer() {
    try {
        await connectDB();

        try {
            const workoutCount = await WorkoutLibrary.countDocuments();
            if (workoutCount === 0) {
                console.log("Workout library is empty. Seeding initial exercises...");
                await importWorkouts();
            } else {
                console.log(`Workout library has ${workoutCount} exercises available.`);
            }
        } catch (seedErr) {
            console.warn("Could not check/seed workout library on startup:", seedErr.message);
        }

        server = app.listen(PORT, HOST, () => {
            console.log(`FitNect API running on http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start FitNect:", error.message);
        process.exitCode = 1;
    }
}

// Global unhandled handlers to ensure clean logging on Render
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

// Graceful shutdown
function handleShutdown(signal) {
    console.log(`Received ${signal}. Gracefully shutting down...`);
    if (server) {
        server.close(async () => {
            try {
                const mongoose = require("mongoose");
                await mongoose.connection.close(false);
                console.log("Closed MongoDB connection.");
            } catch (err) {
                console.error("Error closing MongoDB connection:", err.message);
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();
