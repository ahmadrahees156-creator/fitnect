
import { useMemo, useState } from 'react'
import {
  completeWorkout,
  getWorkouts,
  resetWorkout,
} from '../services/workoutService'

function TrainingActivity() {
  const [workouts, setWorkouts] = useState(() => getWorkouts())
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [checkedExercises, setCheckedExercises] = useState({})

  const selectedWorkout = workouts.find(
    (workout) => workout.id === selectedId
  )

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((workout) => {
      const matchesCategory =
        category === 'All' || workout.category === category

      const matchesDifficulty =
        difficulty === 'All' || workout.difficulty === difficulty

      return matchesCategory && matchesDifficulty
    })
  }, [workouts, category, difficulty])

  const completedCount = workouts.filter(
    (workout) => workout.completed
  ).length

  const totalMinutes = workouts.reduce(
    (total, workout) =>
      total + (workout.completed ? workout.duration : 0),
    0
  )

  function toggleExercise(workoutId, exerciseId) {
    const key = `${workoutId}-${exerciseId}`

    setCheckedExercises((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  function handleComplete(workout) {
    const allChecked = workout.exercises.every(
      (exercise) => checkedExercises[`${workout.id}-${exercise.id}`]
    )

    if (!allChecked) return

    setWorkouts(completeWorkout(workout.id))
    setSelectedId(null)
  }

  function handleReset(workoutId) {
    setWorkouts(resetWorkout(workoutId))

    setCheckedExercises((previous) => {
      const updated = { ...previous }

      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`${workoutId}-`)) {
          delete updated[key]
        }
      })

      return updated
    })
  }

  const selectClass =
    'rounded-xl border border-[#E8DDF0] bg-white px-3 py-2.5 text-sm text-[#5D496F] outline-none focus:border-[#B88AD5]'

  return (
    <div className="fitnect-enter space-y-7">
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#332743] via-[#49345B] to-[#76518B] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#E7A9E5]/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#EBC7EF]">
            Your movement, your pace
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Make every session count.
          </h2>

          <p className="mt-3 max-w-lg text-sm leading-6 text-[#DED2E7]">
            Choose a workout, follow the exercises, and track your
            progress one session at a time.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Workouts completed
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{totalMinutes}</p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Minutes completed
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">
                {workouts.length - completedCount}
              </p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Workouts remaining
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
              Training library
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#302442]">
              Find your next workout
            </h2>
            <p className="mt-1 text-sm text-[#92879F]">
              Pick a session that matches your energy today.
            </p>
          </div>

          <span className="rounded-full border border-[#E9E0F0] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#92829E]">
            {filteredWorkouts.length} SESSIONS
          </span>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={selectClass}
          >
            <option value="All">All categories</option>
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="Recovery">Recovery</option>
          </select>

          <select
            aria-label="Filter by difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className={selectClass}
          >
            <option value="All">All levels</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Challenging">Challenging</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkouts.map((workout) => (
            <article
              key={workout.id}
              className="group overflow-hidden rounded-[22px] border border-[#ECE6F2] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D9C6E9] hover:shadow-[0_15px_35px_rgba(72,46,94,.07)]"
            >
              <div
                className="relative flex h-32 items-center justify-center overflow-hidden"
                style={{ backgroundColor: workout.color }}
              >
                <div className="absolute h-24 w-24 rounded-full border border-white/60" />
                <div className="absolute h-16 w-16 rounded-full border border-white/60" />

                <span className="relative text-4xl font-black text-[#69527D] transition duration-300 group-hover:scale-110">
                  {workout.category === 'Strength'
                    ? '↗'
                    : workout.category === 'Cardio'
                      ? '〰'
                      : '✳'}
                </span>

                {workout.completed && (
                  <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#43845D] shadow-sm">
                    Completed ✓
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#F3EDF9] px-2.5 py-1 text-[10px] font-bold text-[#806991]">
                    {workout.category}
                  </span>
                  <span className="rounded-full bg-[#F8F5FA] px-2.5 py-1 text-[10px] font-semibold text-[#9686A1]">
                    {workout.difficulty}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-[#382749]">
                  {workout.title}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-5 text-[#92849D]">
                  {workout.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#F0EAF4] pt-4">
                  <span className="text-xs font-semibold text-[#8D7C9C]">
                    ◷ {workout.duration} minutes
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedId(workout.id)}
                    className="rounded-xl bg-[#332743] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#4A365D]"
                  >
                    {workout.completed ? 'Review workout' : 'Start workout'} →
                  </button>
                </div>

                {workout.completed && (
                  <button
                    type="button"
                    onClick={() => handleReset(workout.id)}
                    className="mt-3 text-xs font-semibold text-[#9B648F] transition hover:text-[#75456C]"
                  >
                    Reset progress
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {filteredWorkouts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#DCCFE7] bg-white p-8 text-center">
            <p className="font-bold text-[#493456]">No workouts found</p>
            <p className="mt-2 text-sm text-[#92849D]">
              Try changing your filters.
            </p>
          </div>
        )}
      </section>

      {selectedWorkout && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#21172D]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedId(null)
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[26px] bg-[#FCFAFE] p-5 shadow-2xl sm:rounded-[26px] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
                  Workout session
                </p>
                <h2
                  id="workout-dialog-title"
                  className="mt-2 text-2xl font-bold text-[#302442]"
                >
                  {selectedWorkout.title}
                </h2>
                <p className="mt-1 text-sm text-[#92879F]">
                  {selectedWorkout.duration} minutes ·{' '}
                  {selectedWorkout.difficulty}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close workout"
                onClick={() => setSelectedId(null)}
                className="rounded-xl border border-[#E8DDF0] bg-white px-3 py-2 text-[#735A86] hover:bg-[#F3EDF9]"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {selectedWorkout.exercises.map((exercise, index) => {
                const key = `${selectedWorkout.id}-${exercise.id}`
                const checked = Boolean(checkedExercises[key])

                return (
                  <label
                    key={exercise.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                      checked
                        ? 'border-[#C6E6D1] bg-[#F0F9F3]'
                        : 'border-[#ECE6F2] bg-white hover:border-[#DCC7E8]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleExercise(selectedWorkout.id, exercise.id)
                      }
                      className="h-4 w-4 accent-[#9469B2]"
                    />

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E5F8] text-xs font-bold text-[#795792]">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-bold ${
                          checked
                            ? 'text-[#5E8A6C] line-through'
                            : 'text-[#493456]'
                        }`}
                      >
                        {exercise.name}
                      </span>
                      <span className="mt-1 block text-xs text-[#92849D]">
                        {exercise.detail}
                      </span>
                    </span>

                    {checked && (
                      <span className="text-sm font-bold text-[#4B9A69]">
                        ✓
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-semibold text-[#8D7C9C]">
                <span>Exercise progress</span>
                <span>
                  {
                    selectedWorkout.exercises.filter(
                      (exercise) =>
                        checkedExercises[
                          `${selectedWorkout.id}-${exercise.id}`
                        ]
                    ).length
                  }{' '}
                  / {selectedWorkout.exercises.length}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#EAE1F1]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B58AD8] to-[#E28CCF] transition-all duration-300"
                  style={{
                    width: `${
                      (selectedWorkout.exercises.filter(
                        (exercise) =>
                          checkedExercises[
                            `${selectedWorkout.id}-${exercise.id}`
                          ]
                      ).length /
                        selectedWorkout.exercises.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={
                selectedWorkout.completed ||
                !selectedWorkout.exercises.every(
                  (exercise) =>
                    checkedExercises[
                      `${selectedWorkout.id}-${exercise.id}`
                    ]
                )
              }
              onClick={() => handleComplete(selectedWorkout)}
              className="mt-6 w-full rounded-xl bg-[#332743] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#4A365D] disabled:cursor-not-allowed disabled:bg-[#D8CFDF] disabled:text-[#84768E]"
            >
              {selectedWorkout.completed
                ? 'Workout already completed ✓'
                : 'Complete workout'}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-[#AA9DB3]">
              Demo tracking only. Choose exercises appropriate for your
              fitness level and stop if you feel pain.
            </p>
          </section>
        </div>
      )}

      <p className="text-center text-[11px] leading-5 text-[#AA9DB3]">
        Your demo progress is stored in this browser. It is not synced to
        your account or backend yet.
      </p>
    </div>
  )
}

export default TrainingActivity
