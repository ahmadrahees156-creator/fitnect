
import { useEffect, useMemo, useState } from 'react'
import { createWorkout, getWorkouts } from '../services/workoutService'
import { getWorkoutLibrary } from '../services/workoutLibraryService'

const categoryOptions = [
  { label: 'All categories', value: 'All' },
  { label: 'Strength', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Flexibility', value: 'flexibility' },
  { label: 'Yoga', value: 'yoga' },
  { label: 'Sports', value: 'sports' },
  { label: 'Other', value: 'other' },
]

const selectClass =
  'rounded-xl border border-[#E8DDF0] bg-white px-3 py-2.5 text-sm text-[#5D496F] outline-none focus:border-[#B88AD5]'

function getWorkoutList(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.workouts)) return response.workouts
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.workouts)) return response.data.workouts
  if (Array.isArray(response?.results)) return response.results
  return []
}

function formatCategory(category = 'other') {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

function TrainingActivity() {
  const [workouts, setWorkouts] = useState([])
  const [category, setCategory] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    category: 'strength',
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: '',
    notes: '',
    exercises: [{ name: '', sets: '', reps: '', weightKg: '' }],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [libraryWorkouts, setLibraryWorkouts] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [libraryError, setLibraryError] = useState('')

  useEffect(() => {
    let active = true
    async function loadLibrary() {
      setLibraryLoading(true)
      setLibraryError('')
      try {
        const response = await getWorkoutLibrary({ page: 1, limit: 12 })
        const items = response?.workouts ?? response?.data?.workouts ?? []
        if (active) setLibraryWorkouts(Array.isArray(items) ? items : [])
      } catch (err) {
        if (active) setLibraryError('Workout library could not be loaded. Please try again.')
      } finally {
        if (active) setLibraryLoading(false)
      }
    }
    loadLibrary()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function loadWorkouts() {
      setLoading(true)
      setError('')

      try {
        const response = await getWorkouts({
          page: 1,
          limit: 50,
          category,
        })

        if (active) {
          setWorkouts(getWorkoutList(response))
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              'Could not load workouts. Please try again.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadWorkouts()

    return () => {
      active = false
    }
  }, [category, refreshKey])

  const filteredWorkouts = useMemo(() => {
    if (category === 'All') return workouts

    return workouts.filter(
      (workout) =>
        workout.category?.toLowerCase() === category.toLowerCase()
    )
  }, [workouts, category])

  const selectedWorkout = filteredWorkouts.find(
    (workout) => String(workout._id ?? workout.id) === String(selectedId)
  )

  const totalMinutes = filteredWorkouts.reduce(
    (total, workout) => total + (Number(workout.durationMinutes) || 0),
    0
  )

  const exerciseList = Array.isArray(selectedWorkout?.exercises)
    ? selectedWorkout.exercises
    : []

  function updateWorkoutField(field, value) {
    setNewWorkout((current) => ({ ...current, [field]: value }))
  }

  function updateExercise(index, field, value) {
    setNewWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise
      ),
    }))
  }

  function resetWorkoutForm() {
    setNewWorkout({
      title: '',
      category: 'strength',
      date: new Date().toISOString().slice(0, 10),
      durationMinutes: '',
      notes: '',
      exercises: [{ name: '', sets: '', reps: '', weightKg: '' }],
    })
    setFormError('')
  }

  async function handleCreateWorkout(event) {
    event.preventDefault()
    setFormError('')

    const exercises = newWorkout.exercises
      .filter((exercise) => exercise.name.trim())
      .map((exercise) => ({
        name: exercise.name.trim(),
        ...(exercise.sets !== '' ? { sets: Number(exercise.sets) } : {}),
        ...(exercise.reps !== '' ? { reps: Number(exercise.reps) } : {}),
        ...(exercise.weightKg !== '' ? { weightKg: Number(exercise.weightKg) } : {}),
      }))

    if (!newWorkout.title.trim() || !newWorkout.durationMinutes) {
      setFormError('Please enter a workout title and duration.')
      return
    }

    if (exercises.length === 0) {
      setFormError('Add at least one exercise with a name.')
      return
    }

    setSaving(true)
    try {
      await createWorkout({
        title: newWorkout.title.trim(),
        category: newWorkout.category,
        date: newWorkout.date || undefined,
        durationMinutes: Number(newWorkout.durationMinutes),
        notes: newWorkout.notes.trim(),
        exercises,
      })
      setShowAddForm(false)
      resetWorkoutForm()
      setCategory('All')
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Could not save this workout. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  function formatExercise(exercise) {
    const details = []

    if (exercise.sets != null) details.push(`${exercise.sets} sets`)
    if (exercise.reps != null) details.push(`${exercise.reps} reps`)
    if (exercise.weightKg != null) details.push(`${exercise.weightKg} kg`)
    if (exercise.durationSeconds != null) {
      details.push(`${exercise.durationSeconds} seconds`)
    }
    if (exercise.distanceKm != null) {
      details.push(`${exercise.distanceKm} km`)
    }

    return details.length ? details.join(' · ') : 'Details not provided'
  }

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
            Explore your saved workouts and review the exercises in each session.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{filteredWorkouts.length}</p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Workouts loaded
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{totalMinutes}</p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Total workout minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
            Training library
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#302442]">
            Your workouts
          </h2>

          <p className="mt-1 text-sm text-[#92879F]">
            Workouts are loaded from your FitNect account.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setSelectedId(null)
            }}
            className={selectClass}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              resetWorkoutForm()
              setShowAddForm(true)
            }}
            className="rounded-xl bg-[#332743] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#4A365D]"
          >
            + Add Workout
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-[#ECE6F2] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E8DDF0] border-t-[#9469B2]" />
            <p className="mt-4 text-sm text-[#92849D]">
              Loading your workouts...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-[#F0C9C9] bg-white p-6">
            <p className="font-bold text-[#9B4545]">
              Unable to load workouts
            </p>
            <p className="mt-2 text-sm text-[#92849D]">{error}</p>
            <button
              type="button"
              onClick={() => setCategory((current) => current)}
              className="mt-4 rounded-xl bg-[#332743] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4A365D]"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredWorkouts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#DCCFE7] bg-white p-8 text-center">
            <p className="font-bold text-[#493456]">No workouts found</p>
            <p className="mt-2 text-sm text-[#92849D]">
              There are no saved workouts for this category yet.
            </p>
          </div>
        )}

        {!loading && !error && filteredWorkouts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkouts.map((workout) => {
              const workoutId = workout._id ?? workout.id
              const categoryName = workout.category || 'other'
              const duration = Number(workout.durationMinutes) || 0
              const exercises = Array.isArray(workout.exercises)
                ? workout.exercises
                : []

              return (
                <article
                  key={workoutId}
                  className="group overflow-hidden rounded-[22px] border border-[#ECE6F2] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D9C6E9] hover:shadow-[0_15px_35px_rgba(72,46,94,.07)]"
                >
                  <div className="relative flex h-32 items-center justify-center overflow-hidden bg-[#EDE2F8]">
                    <div className="absolute h-24 w-24 rounded-full border border-white/70" />
                    <div className="absolute h-16 w-16 rounded-full border border-white/70" />

                    <span className="relative text-4xl font-black text-[#69527D] transition duration-300 group-hover:scale-110">
                      {categoryName === 'strength'
                        ? '↗'
                        : categoryName === 'cardio'
                          ? '〰'
                          : '＋'}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F3EDF9] px-2.5 py-1 text-[10px] font-bold text-[#806991]">
                        {formatCategory(categoryName)}
                      </span>

                      <span className="rounded-full bg-[#F8F5FA] px-2.5 py-1 text-[10px] font-semibold text-[#9686A1]">
                        {exercises.length} exercises
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-[#382749]">
                      {workout.title || 'Untitled workout'}
                    </h3>

                    <p className="mt-2 min-h-10 text-sm leading-5 text-[#92849D]">
                      {workout.notes || 'Review the exercises in this session.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#F0EAF4] pt-4">
                      <span className="text-xs font-semibold text-[#8D7C9C]">
                        ◷ {duration} minutes
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedId(workoutId)}
                        className="rounded-xl bg-[#332743] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#4A365D]"
                      >
                        View workout →
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-3xl border border-[#ECE6F2] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-[#A08BAF]">Explore</p>
            <h2 className="mt-2 text-2xl font-bold text-[#302442]">Workout library</h2>
            <p className="mt-1 text-sm text-[#92879F]">Browse curated workout options from FitNect.</p>
          </div>
          <button type="button" onClick={() => setLibraryLoading(true) || getWorkoutLibrary({ page: 1, limit: 12 }).then((response) => { const items = response?.workouts ?? response?.data?.workouts ?? []; setLibraryWorkouts(Array.isArray(items) ? items : []); setLibraryError('') }).catch(() => setLibraryError('Workout library could not be loaded. Please try again.')).finally(() => setLibraryLoading(false))} className="rounded-full border border-[#E8DDF0] px-4 py-2 text-sm font-semibold text-[#735A86] hover:bg-[#F3EDF9]">Refresh library</button>
        </div>
        {libraryError && <p role="alert" className="mt-4 rounded-xl bg-[#FFF7F7] p-4 text-sm text-[#9B4545]">{libraryError}</p>}
        {libraryLoading ? (
          <p className="mt-5 text-sm text-[#92879F]">Loading workout library...</p>
        ) : libraryWorkouts.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {libraryWorkouts.map((item) => (
              <article key={item._id ?? item.id ?? item.name} className="rounded-2xl border border-[#ECE6F2] bg-[#FCFAFE] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-[#493456]">{item.name || item.title || 'Workout'}</h3>
                  <span className="shrink-0 rounded-full bg-[#E4DBF4] px-2.5 py-1 text-[10px] font-bold uppercase text-[#735A86]">{item.difficulty || 'All levels'}</span>
                </div>
                <p className="mt-2 text-xs font-semibold capitalize text-[#92879F]">{item.category || 'General'}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}</p>
                {item.description && <p className="mt-3 text-sm leading-5 text-[#68676D]">{item.description}</p>}
                {Array.isArray(item.exercises) && item.exercises.length > 0 && <p className="mt-3 text-xs text-[#92879F]">{item.exercises.length} exercises</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[#F8F5FC] p-5 text-sm text-[#92879F]">The library is empty right now. Add active workouts to the backend library to display them here.</p>
        )}
      </section>

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#21172D]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={(event) => {
            if (event.target === event.currentTarget && !saving) setShowAddForm(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-workout-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[26px] bg-[#FCFAFE] p-5 shadow-2xl sm:rounded-[26px] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">Training library</p>
                <h2 id="add-workout-title" className="mt-2 text-2xl font-bold text-[#302442]">Add a workout</h2>
                <p className="mt-1 text-sm text-[#92879F]">Save a session to your FitNect account.</p>
              </div>
              <button
                type="button"
                aria-label="Close add workout"
                disabled={saving}
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-[#E8DDF0] bg-white px-3 py-2 text-[#735A86] hover:bg-[#F3EDF9] disabled:opacity-50"
              >✕</button>
            </div>

            <form onSubmit={handleCreateWorkout} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-semibold text-[#5D496F]">
                  Workout title *
                  <input
                    required
                    value={newWorkout.title}
                    onChange={(event) => updateWorkoutField('title', event.target.value)}
                    placeholder="e.g. Upper body day"
                    className={`${selectClass} w-full`}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-[#5D496F]">
                  Category *
                  <select
                    value={newWorkout.category}
                    onChange={(event) => updateWorkoutField('category', event.target.value)}
                    className={`${selectClass} w-full`}
                  >
                    {categoryOptions.filter((option) => option.value !== 'All').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-[#5D496F]">
                  Duration (minutes) *
                  <input
                    required
                    type="number"
                    min="1"
                    value={newWorkout.durationMinutes}
                    onChange={(event) => updateWorkoutField('durationMinutes', event.target.value)}
                    placeholder="45"
                    className={`${selectClass} w-full`}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-[#5D496F]">
                  Date
                  <input
                    type="date"
                    value={newWorkout.date}
                    onChange={(event) => updateWorkoutField('date', event.target.value)}
                    className={`${selectClass} w-full`}
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#493456]">Exercises *</h3>
                  <button
                    type="button"
                    onClick={() => setNewWorkout((current) => ({
                      ...current,
                      exercises: [...current.exercises, { name: '', sets: '', reps: '', weightKg: '' }],
                    }))}
                    className="rounded-lg border border-[#E8DDF0] bg-white px-3 py-2 text-xs font-bold text-[#735A86] hover:bg-[#F3EDF9]"
                  >+ Add exercise</button>
                </div>
                <div className="space-y-3">
                  {newWorkout.exercises.map((exercise, index) => (
                    <div key={index} className="rounded-2xl border border-[#ECE6F2] bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#806991]">Exercise {index + 1}</span>
                        {newWorkout.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewWorkout((current) => ({
                              ...current,
                              exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
                            }))}
                            className="text-xs font-semibold text-[#9B4545]"
                          >Remove</button>
                        )}
                      </div>
                      <input
                        aria-label={`Exercise ${index + 1} name`}
                        value={exercise.name}
                        onChange={(event) => updateExercise(index, 'name', event.target.value)}
                        placeholder="Exercise name (e.g. Squats)"
                        className={`${selectClass} w-full`}
                      />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { field: 'sets', label: 'Sets', placeholder: '3' },
                          { field: 'reps', label: 'Reps', placeholder: '12' },
                          { field: 'weightKg', label: 'Weight (kg)', placeholder: '20' },
                        ].map((item) => (
                          <label key={item.field} className="space-y-1 text-xs font-semibold text-[#8D7C9C]">
                            {item.label}
                            <input
                              type="number"
                              min="0"
                              value={exercise[item.field]}
                              onChange={(event) => updateExercise(index, item.field, event.target.value)}
                              placeholder={item.placeholder}
                              className={`${selectClass} w-full min-w-0 px-2`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5 text-sm font-semibold text-[#5D496F]">
                Notes (optional)
                <textarea
                  rows="3"
                  value={newWorkout.notes}
                  onChange={(event) => updateWorkoutField('notes', event.target.value)}
                  placeholder="How did the session feel?"
                  className={`${selectClass} w-full resize-y`}
                />
              </label>

              {formError && (
                <p role="alert" className="rounded-xl border border-[#F0C9C9] bg-[#FFF7F7] px-4 py-3 text-sm text-[#9B4545]">{formError}</p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-[#E8DDF0] bg-white px-5 py-3 text-sm font-bold text-[#735A86] hover:bg-[#F3EDF9] disabled:opacity-50"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#332743] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4A365D] disabled:cursor-not-allowed disabled:opacity-60"
                >{saving ? 'Saving workout...' : 'Save workout'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

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
                  Workout details
                </p>

                <h2
                  id="workout-dialog-title"
                  className="mt-2 text-2xl font-bold text-[#302442]"
                >
                  {selectedWorkout.title || 'Untitled workout'}
                </h2>

                <p className="mt-1 text-sm text-[#92879F]">
                  {Number(selectedWorkout.durationMinutes) || 0} minutes ·{' '}
                  {formatCategory(selectedWorkout.category || 'other')}
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

            {selectedWorkout.notes && (
              <p className="mt-4 text-sm leading-6 text-[#92849D]">
                {selectedWorkout.notes}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {exerciseList.map((exercise, index) => (
                <div
                  key={exercise._id ?? exercise.id ?? `${exercise.name}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#ECE6F2] bg-white p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E5F8] text-xs font-bold text-[#795792]">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#493456]">
                      {exercise.name || 'Exercise'}
                    </span>
                    <span className="mt-1 block text-xs text-[#92849D]">
                      {formatExercise(exercise)}
                    </span>
                  </span>
                </div>
              ))}

              {exerciseList.length === 0 && (
                <p className="rounded-2xl border border-dashed border-[#DCCFE7] p-6 text-center text-sm text-[#92849D]">
                  No exercise details are available for this workout.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mt-6 w-full rounded-xl bg-[#332743] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#4A365D]"
            >
              Close workout
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default TrainingActivity
