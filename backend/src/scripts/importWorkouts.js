require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const WorkoutLibrary = require("../models/WorkoutLibrary");

const FALLBACK_WORKOUTS = [
  {
    name: "Push-Up",
    description: "Classic bodyweight exercise strengthening the pectorals, deltoids, and triceps.",
    category: "strength",
    difficulty: "beginner",
    targetMuscles: ["chest", "triceps", "shoulders"],
    equipment: ["body only"],
    instructions: [
      "Place hands slightly wider than shoulder-width apart.",
      "Keep body in a straight plank line from head to heels.",
      "Lower chest until elbows reach 90 degrees.",
      "Push back up to starting position."
    ],
    durationMinutes: 15,
    isActive: true
  },
  {
    name: "Bodyweight Squat",
    description: "Fundamental compound lower-body movement targeting quads, glutes, and hamstrings.",
    category: "strength",
    difficulty: "beginner",
    targetMuscles: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["body only"],
    instructions: [
      "Stand with feet shoulder-width apart, toes slightly turned out.",
      "Hinge at hips and bend knees, keeping chest lifted.",
      "Lower until thighs are parallel to the floor.",
      "Drive through heels to stand back up."
    ],
    durationMinutes: 15,
    isActive: true
  },
  {
    name: "Plank",
    description: "Isometric core stability exercise that strengthens the entire abdominal wall and lower back.",
    category: "strength",
    difficulty: "beginner",
    targetMuscles: ["abdominals", "core"],
    equipment: ["body only"],
    instructions: [
      "Rest on forearms and toes with elbows directly below shoulders.",
      "Engage core and glutes to keep hips level.",
      "Hold for 30 to 60 seconds without arching the back."
    ],
    durationMinutes: 10,
    isActive: true
  },
  {
    name: "Pull-Up",
    description: "Upper-body pulling exercise targeting the latissimus dorsi, biceps, and upper back.",
    category: "strength",
    difficulty: "intermediate",
    targetMuscles: ["lats", "biceps", "middle back"],
    equipment: ["pull-up bar"],
    instructions: [
      "Grip the bar with overhand grip slightly wider than shoulders.",
      "Pull chest toward the bar by driving elbows downward.",
      "Pause at the top, then lower under control."
    ],
    durationMinutes: 20,
    isActive: true
  },
  {
    name: "Barbell Bench Press",
    description: "Foundational strength exercise for upper body pressing power.",
    category: "strength",
    difficulty: "intermediate",
    targetMuscles: ["chest", "triceps", "shoulders"],
    equipment: ["barbell", "bench"],
    instructions: [
      "Lie flat on bench with eyes under barbell.",
      "Unrack bar and lower with control to mid-chest.",
      "Press bar explosively back to starting position."
    ],
    durationMinutes: 30,
    isActive: true
  },
  {
    name: "Deadlift",
    description: "Complete posterior chain compound movement building raw hip hinge power.",
    category: "strength",
    difficulty: "advanced",
    targetMuscles: ["hamstrings", "glutes", "lower back", "traps"],
    equipment: ["barbell"],
    instructions: [
      "Stand with feet hip-width apart, bar over midfoot.",
      "Hinge down and grip bar, flat back, chest proud.",
      "Drive through the floor, extending hips and knees simultaneously."
    ],
    durationMinutes: 35,
    isActive: true
  },
  {
    name: "Jumping Jacks",
    description: "Full-body cardiovascular warmup movement promoting aerobic endurance.",
    category: "cardio",
    difficulty: "beginner",
    targetMuscles: ["calves", "shoulders", "quadriceps"],
    equipment: ["body only"],
    instructions: [
      "Stand upright with arms at sides.",
      "Jump feet out while swinging arms overhead.",
      "Return to starting position and repeat at a brisk pace."
    ],
    durationMinutes: 10,
    isActive: true
  },
  {
    name: "High Knees",
    description: "Dynamic cardio drill that raises heart rate and strengthens hip flexors.",
    category: "cardio",
    difficulty: "intermediate",
    targetMuscles: ["quadriceps", "hip flexors", "calves"],
    equipment: ["body only"],
    instructions: [
      "Run in place, driving knees up toward hip level.",
      "Pump arms in rhythm with opposite knees.",
      "Land lightly on the balls of your feet."
    ],
    durationMinutes: 15,
    isActive: true
  },
  {
    name: "Burpees",
    description: "Intense full-body calisthenic movement providing high cardiovascular demand.",
    category: "cardio",
    difficulty: "advanced",
    targetMuscles: ["full body", "chest", "legs", "core"],
    equipment: ["body only"],
    instructions: [
      "From standing, drop into a squat and place hands on the floor.",
      "Kick feet back into a plank, perform a push-up.",
      "Hop feet forward to hands and jump up with arms extended."
    ],
    durationMinutes: 20,
    isActive: true
  },
  {
    name: "Downward-Facing Dog",
    description: "Classic yoga posture that elongates the spine, stretches hamstrings and calves, and builds shoulder stability.",
    category: "yoga",
    difficulty: "beginner",
    targetMuscles: ["hamstrings", "calves", "shoulders"],
    equipment: ["mat"],
    instructions: [
      "Start on all fours, hands shoulder-width, knees hip-width.",
      "Tuck toes and lift hips toward the ceiling, forming an inverted V.",
      "Press chest gently toward thighs, lengthening spine."
    ],
    durationMinutes: 10,
    isActive: true
  },
  {
    name: "Warrior II",
    description: "Standing yoga pose fostering leg endurance, hip opening, and mental focus.",
    category: "yoga",
    difficulty: "intermediate",
    targetMuscles: ["quadriceps", "groin", "shoulders"],
    equipment: ["mat"],
    instructions: [
      "Step feet wide apart, turn front foot forward and back foot 90 degrees.",
      "Bend front knee to 90 degrees, extending arms parallel to floor.",
      "Gaze over front fingertips and breathe steadily."
    ],
    durationMinutes: 15,
    isActive: true
  },
  {
    name: "Hamstring Static Stretch",
    description: "Gentle recovery stretch to release posterior chain tension.",
    category: "flexibility",
    difficulty: "beginner",
    targetMuscles: ["hamstrings", "lower back"],
    equipment: ["mat"],
    instructions: [
      "Sit on the floor with legs extended straight.",
      "Hinge at the hips reaching fingertips toward toes.",
      "Hold without bouncing for 30 to 45 seconds."
    ],
    durationMinutes: 10,
    isActive: true
  },
  {
    name: "Agility Ladder Drills",
    description: "Footwork and coordination conditioning for athletic quickness.",
    category: "sports",
    difficulty: "intermediate",
    targetMuscles: ["calves", "quadriceps", "core"],
    equipment: ["agility ladder"],
    instructions: [
      "Perform two-in, two-out rapid foot contacts through each ladder rung.",
      "Keep center of gravity low and knees soft.",
      "Repeat for 4 to 6 sets."
    ],
    durationMinutes: 20,
    isActive: true
  },
  {
    name: "Dynamic Mobility Routine",
    description: "Multi-joint full-body movement preparation for athletic training.",
    category: "other",
    difficulty: "beginner",
    targetMuscles: ["hips", "thoracic spine", "ankles"],
    equipment: ["body only"],
    instructions: [
      "Perform arm circles, hip openers, and ankle rotations.",
      "Transition through deep lunge with spinal twist.",
      "Repeat 10 repetitions per movement."
    ],
    durationMinutes: 12,
    isActive: true
  }
];

function findExerciseDataset() {
  const candidatePaths = [
    path.join(__dirname, "..", "..", "data", "exercises.json"),
    path.join(__dirname, "..", "data", "exercises.json"),
    path.join(process.cwd(), "data", "exercises.json"),
    path.join(process.cwd(), "backend", "data", "exercises.json"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const VALID_CATEGORIES = new Set(["strength", "cardio", "flexibility", "yoga", "sports", "other"]);
const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

function sanitizeWorkout(item) {
  if (!item || !item.name) return null;

  const category = (item.category || "other").toLowerCase();
  const difficulty = (item.difficulty || "beginner").toLowerCase();

  return {
    name: String(item.name).trim().slice(0, 120),
    description: String(item.description || item.name).trim().slice(0, 1000),
    category: VALID_CATEGORIES.has(category) ? category : "other",
    difficulty: VALID_DIFFICULTIES.has(difficulty) ? difficulty : "beginner",
    targetMuscles: Array.isArray(item.targetMuscles)
      ? item.targetMuscles.map(m => String(m).trim()).filter(Boolean)
      : [],
    equipment: Array.isArray(item.equipment)
      ? item.equipment.map(e => String(e).trim()).filter(Boolean)
      : [],
    instructions: Array.isArray(item.instructions)
      ? item.instructions.map(i => String(i).trim().slice(0, 500)).filter(Boolean)
      : [],
    imageUrl: String(item.imageUrl || "").trim(),
    videoUrl: String(item.videoUrl || "").trim(),
    durationMinutes: Number(item.durationMinutes) > 0 ? Number(item.durationMinutes) : 15,
    isActive: item.isActive !== false,
  };
}

async function importWorkouts() {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    await connectDB();
  }

  const datasetPath = findExerciseDataset();
  let exerciseList = [];

  if (datasetPath) {
    try {
      console.log(`Loading workout dataset from: ${datasetPath}`);
      const rawData = fs.readFileSync(datasetPath, "utf8");
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        exerciseList = parsed;
      }
    } catch (readErr) {
      console.warn("Failed reading exercises.json, using fallback exercises:", readErr.message);
    }
  }

  if (exerciseList.length === 0) {
    console.log("Using built-in fallback workouts collection...");
    exerciseList = FALLBACK_WORKOUTS;
  }

  const sanitized = exerciseList
    .map(sanitizeWorkout)
    .filter(Boolean);

  if (sanitized.length === 0) {
    console.warn("No valid workout records to import.");
    return { count: 0 };
  }

  const BATCH_SIZE = 250;
  let importedCount = 0;

  for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
    const chunk = sanitized.slice(i, i + BATCH_SIZE);
    const operations = chunk.map(workout => ({
      updateOne: {
        filter: { name: workout.name },
        update: { $set: workout },
        upsert: true,
      },
    }));

    await WorkoutLibrary.bulkWrite(operations, { ordered: false });
    importedCount += chunk.length;
  }

  const totalInDb = await WorkoutLibrary.countDocuments();
  console.log(`Workout import complete: processed ${importedCount} records. Total workouts in DB: ${totalInDb}`);

  return { imported: importedCount, total: totalInDb };
}

module.exports = importWorkouts;

if (require.main === module) {
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
