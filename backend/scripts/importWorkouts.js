// Proxy to src/scripts/importWorkouts.js
const importWorkouts = require("../src/scripts/importWorkouts");

module.exports = importWorkouts;

if (require.main === module) {
  // If run directly via node scripts/importWorkouts.js
  const mongoose = require("mongoose");
  importWorkouts()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Workout import failed:", error.message);
      try {
        await mongoose.disconnect();
      } catch (_) {}
      process.exit(1);
    });
}
