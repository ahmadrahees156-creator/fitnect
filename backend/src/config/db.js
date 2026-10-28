const mongoose = require("mongoose");

let isConnecting = false;

async function connectDB() {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI) {
        throw new Error("MONGODB_URI or MONGO_URI environment variable is not configured");
    }

    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (isConnecting) {
        return;
    }

    isConnecting = true;

    try {
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    } finally {
        isConnecting = false;
    }
}

mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection disconnected");
});

module.exports = connectDB;
