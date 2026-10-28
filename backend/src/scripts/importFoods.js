// Re-export root scripts/importFoods.js
const importFoods = require("../../scripts/importFoods");

module.exports = importFoods;

if (require.main === module) {
  const mongoose = require("mongoose");
  importFoods()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Food import failed:", error.message);
      try {
        await mongoose.disconnect();
      } catch (_) {}
      process.exit(1);
    });
}
