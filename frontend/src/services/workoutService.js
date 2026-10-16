
const STORAGE_KEY = 'fitnect_workouts'

const initialWorkouts = [
  {
    id: 1,
    title: 'Full Body Strength',
    category: 'Strength',
    difficulty: 'Moderate',
    duration: 35,
    description: 'Build strength with a balanced full-body workout.',
    color: '#EDE2F8',
    exercises: [
      { id: 1, name: 'Bodyweight squats', detail: '3 sets × 12 reps' },
      { id: 2, name: 'Push-ups', detail: '3 sets × 10 reps' },
      { id: 3, name: 'Dumbbell rows', detail: '3 sets × 12 reps' },
      { id: 4, name: 'Plank', detail: '3 sets × 30 seconds' },
    ],
  },
  {
    id: 2,
    title: 'Mobility & Stretching',
    category: 'Recovery',
    difficulty: 'Easy',
    duration: 15,
    description: 'Improve flexibility and ease muscle tension.',
    color: '#DDF3E6',
    exercises: [
      { id: 1, name: 'Neck and shoulder rolls', detail: '2 minutes' },
      { id: 2, name: 'Cat-cow stretch', detail: '2 sets × 10 reps' },
      { id: 3, name: 'Hamstring stretch', detail: '30 seconds each side' },
      { id: 4, name: 'Child’s pose', detail: '2 minutes' },
    ],
  },
  {
    id: 3,
    title: 'Low-Impact Cardio',
    category: 'Cardio',
    difficulty: 'Easy',
    duration: 20,
    description: 'Get moving with a low-impact cardio session.',
    color: '#DFEAFB',
    exercises: [
      { id: 1, name: 'March in place', detail: '3 minutes' },
      { id: 2, name: 'Step jacks', detail: '3 sets × 30 seconds' },
      { id: 3, name: 'Standing knee raises', detail: '3 sets × 12 reps' },
      { id: 4, name: 'Slow cooldown walk', detail: '4 minutes' },
    ],
  },
  {
    id: 4,
    title: 'Core Stability',
    category: 'Strength',
    difficulty: 'Challenging',
    duration: 25,
    description: 'Work on balance and core control.',
    color: '#F9E8D8',
    exercises: [
      { id: 1, name: 'Dead bugs', detail: '3 sets × 10 reps' },
      { id: 2, name: 'Bird dogs', detail: '3 sets × 10 reps' },
      { id: 3, name: 'Side plank', detail: '20 seconds each side' },
      { id: 4, name: 'Glute bridges', detail: '3 sets × 12 reps' },
    ],
  },
]

function readWorkouts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialWorkouts
  } catch {
    return initialWorkouts
  }
}

function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}

export function getWorkouts() {
  return readWorkouts()
}

export function completeWorkout(workoutId) {
  const workouts = readWorkouts().map((workout) =>
    workout.id === workoutId
      ? { ...workout, completed: true }
      : workout
  )

  saveWorkouts(workouts)
  return workouts
}

export function resetWorkout(workoutId) {
  const workouts = readWorkouts().map((workout) =>
    workout.id === workoutId
      ? { ...workout, completed: false }
      : workout
  )

  saveWorkouts(workouts)
  return workouts
}
