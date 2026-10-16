require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`FitNect API running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start FitNect:", error.message);
        process.exitCode = 1;
    }
}

startServer();
