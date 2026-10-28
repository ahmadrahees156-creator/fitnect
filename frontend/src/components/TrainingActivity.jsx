
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

const workoutImageRules = [
  {
    keywords: ['yoga', 'sun salutation', 'surya namaskar', 'downward dog', 'child pose'],
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['run', 'running', 'jog', 'treadmill', 'sprint'],
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['cycle', 'cycling', 'bike', 'spin class'],
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['push up', 'push-up', 'bench press', 'chest press', 'chest workout'],
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['squat', 'lunge', 'leg press', 'lower body', 'glute', 'hamstring'],
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['deadlift', 'barbell', 'weightlifting', 'weight lifting', 'strength', 'dumbbell', 'bicep', 'curl', 'tricep'],
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['stretch', 'mobility', 'flexibility', 'warm up', 'warm-up', 'cool down', 'cool-down'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['swim', 'swimming'],
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['basketball'],
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['football', 'soccer'],
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['plank', 'core', 'abs', 'abdominal', 'crunch', 'sit-up', 'sit up'],
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=1000&q=85',
  },
  {
    keywords: ['cardio', 'hiit', 'jump rope', 'burpee', 'aerobic'],
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1000&q=85',
  },
]

const categoryFallbackImages = {
  strength: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=85',
  cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1000&q=85',
  flexibility: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=85',
  sports: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=85',
  other: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=85',
}

function normalizeExerciseName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(machine|exercise|workout|with|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findLibraryGif(workout, exerciseIndex) {
  // Prefer an explicit GIF attached to this workout, otherwise only use a
  // catalogue GIF when the exercise name is an exact match. Fuzzy matching
  // can silently show a different movement (for example, a jump squat for a squat).
  const directGif = getWorkoutGif(workout)
  if (directGif) return directGif
  if (!Array.isArray(exerciseIndex) || !exerciseIndex.length) return ''

  const name = normalizeExerciseName(workout?.name || workout?.title)
  if (!name) return ''

  const exact = exerciseIndex.find((exercise) =>
    normalizeExerciseName(exercise.name) === name &&
    typeof exercise.gifUrl === 'string' &&
    /^https?:\/\//i.test(exercise.gifUrl)
  )
  if (exact) return exact.gifUrl

  // Only allow explicit one-to-one name variants, never broad substring matches.
  const exactAliases = {
    'situp': ['sit up', 'sit-up'],
    'pushup': ['push up', 'push-up'],
    '90 90': ['90/90'],
    'lat pull down': ['lat pulldown'],
    'jumping jacks': ['jumping jack'],
    'crunches': ['crunch'],
  }
  const alternatives = exactAliases[name] || []
  const aliasMatch = exerciseIndex.find((exercise) =>
    alternatives.includes(String(exercise.name || '').toLowerCase().trim()) &&
    typeof exercise.gifUrl === 'string' &&
    /^https?:\/\//i.test(exercise.gifUrl)
  )

  return aliasMatch?.gifUrl || ''
}

function getWorkoutGif(workout) {
  return [
    workout?.gifUrl,
    workout?.gifURL,
    workout?.gif,
    workout?.demoGifUrl,
    workout?.animationUrl,
    workout?.media?.gif,
    workout?.media?.gifUrl,
    workout?.demonstration?.gifUrl,
  ].find((url) => typeof url === 'string' && /^https?:\/\//i.test(url)) || ''
}

function getWorkoutImage(workout) {
  if (workout.imageUrl) return workout.imageUrl

  const workoutText = [
    workout.name,
    workout.title,
    workout.description,
    workout.category,
    ...(Array.isArray(workout.targetMuscles) ? workout.targetMuscles : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const matchingRule = workoutImageRules.find((rule) =>
    rule.keywords.some((keyword) => workoutText.includes(keyword))
  )

  return matchingRule?.image || categoryFallbackImages[workout.category] || categoryFallbackImages.other
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
  const [libraryLoadingMore, setLibraryLoadingMore] = useState(false)
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryTotal, setLibraryTotal] = useState(0)
  const [libraryError, setLibraryError] = useState('')
  const [libraryCategory, setLibraryCategory] = useState('all')
  const [libraryDifficulty, setLibraryDifficulty] = useState('all')
  const [librarySearch, setLibrarySearch] = useState('')
  const [selectedLibraryWorkout, setSelectedLibraryWorkout] = useState(null)
  const [addingLibraryWorkout, setAddingLibraryWorkout] = useState(false)
  const [libraryAddMessage, setLibraryAddMessage] = useState('')
  const [libraryAddError, setLibraryAddError] = useState('')
  const [exerciseGifIndex, setExerciseGifIndex] = useState([])

  useEffect(() => {
    let active = true
    fetch('https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json')
      .then((response) => {
        if (!response.ok) throw new Error('Exercise GIF catalogue unavailable')
        return response.json()
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.exercises
        if (active && Array.isArray(items)) setExerciseGifIndex(items)
      })
      .catch(() => {
        if (active) setExerciseGifIndex([])
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadLibrary() {
      setLibraryLoading(true)
      setLibraryError('')
      setLibraryWorkouts([])
      setLibraryPage(1)
      try {
        const response = await getWorkoutLibrary({
          page: 1,
          limit: 50,
          category: libraryCategory,
          difficulty: libraryDifficulty,
        })
        const items = response?.workouts ?? response?.data?.workouts ?? response?.data ?? []
        if (active) {
          setLibraryWorkouts(Array.isArray(items) ? items : [])
          setLibraryTotal(Number(response?.total ?? response?.data?.total ?? items.length) || 0)
        }
      } catch (err) {
        if (active) setLibraryError(
          err.response?.data?.message || 'Workout library could not be loaded. Please try again.'
        )
      } finally {
        if (active) setLibraryLoading(false)
      }
    }
    loadLibrary()
    return () => { active = false }
  }, [libraryCategory, libraryDifficulty])

  async function handleLoadMoreLibrary() {
    if (libraryLoadingMore || libraryWorkouts.length >= libraryTotal) return

    const nextPage = libraryPage + 1
    setLibraryLoadingMore(true)
    setLibraryError('')
    try {
      const response = await getWorkoutLibrary({
        page: nextPage,
        limit: 50,
        category: libraryCategory,
        difficulty: libraryDifficulty,
      })
      const items = response?.workouts ?? response?.data?.workouts ?? response?.data ?? []
      if (Array.isArray(items)) {
        setLibraryWorkouts((current) => {
          const existingIds = new Set(current.map((item) => String(item._id ?? item.id ?? item.name)))
          const newItems = items.filter((item) => !existingIds.has(String(item._id ?? item.id ?? item.name)))
          return [...current, ...newItems]
        })
        setLibraryPage(nextPage)
        setLibraryTotal(Number(response?.total ?? response?.data?.total ?? libraryTotal) || 0)
      }
    } catch (err) {
      setLibraryError(
        err.response?.data?.message || 'More workouts could not be loaded. Please try again.'
      )
    } finally {
      setLibraryLoadingMore(false)
    }
  }

  const filteredLibraryWorkouts = useMemo(() => {
    const query = librarySearch.trim().toLowerCase()
    if (!query) return libraryWorkouts
    return libraryWorkouts.filter((item) =>
      [item.name, item.title, item.description, item.category, ...(item.targetMuscles || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [libraryWorkouts, librarySearch])

  function formatLibraryText(value) {
    if (typeof value !== 'string') return ''
    return value
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  function formatLibraryLabel(value = 'General') {
    return String(value)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'General'
  }

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

  async function handleAddLibraryWorkoutToDaily() {
    if (!selectedLibraryWorkout || addingLibraryWorkout) return

    const title = formatLibraryText(
      selectedLibraryWorkout.name || selectedLibraryWorkout.title || 'Workout'
    )
    const allowedCategories = ['strength', 'cardio', 'flexibility', 'yoga', 'sports', 'other']
    const rawCategory = String(selectedLibraryWorkout.category || 'other').toLowerCase()
    const workoutCategory = allowedCategories.includes(rawCategory) ? rawCategory : 'other'

    setAddingLibraryWorkout(true)
    setLibraryAddError('')
    setLibraryAddMessage('')

    try {
      await createWorkout({
        title,
        category: workoutCategory,
        date: new Date().toISOString().slice(0, 10),
        durationMinutes: Number(selectedLibraryWorkout.durationMinutes) || 15,
        notes: formatLibraryText(selectedLibraryWorkout.description || ''),
        exercises: [{ name: title }],
      })
      setLibraryAddMessage('Added to your daily workout.')
      setCategory('All')
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setLibraryAddError(
        err.response?.data?.message || 'Could not add this workout. Please try again.'
      )
    } finally {
      setAddingLibraryWorkout(false)
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
              onClick={() => setRefreshKey((key) => key + 1)}
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
                  <div className="relative h-44 overflow-hidden bg-[#EDE2F8] sm:h-48">
                    <img
                      src={getWorkoutImage(workout)}
                      alt={`${workout.title || 'Workout'} preview`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = categoryFallbackImages[categoryName] || categoryFallbackImages.other
                      }}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#21172D]/45 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] font-bold capitalize text-[#493456] shadow-sm backdrop-blur">
                      {formatCategory(categoryName)}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#493456] shadow-sm backdrop-blur">
                      {duration} min
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

      <section className="mb-8 overflow-hidden rounded-[28px] border border-[#EEE7F4] bg-white shadow-[0_18px_55px_rgba(54,35,73,0.05)]">
        <div className="relative overflow-hidden bg-[#F1EAF8] px-5 py-6 sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full bg-[#F373D4]/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-65px] right-1/4 h-40 w-40 rounded-full bg-[#CAECD6]/70 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8A719D]">Discover movement</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#151517] sm:text-3xl">Workout library</h2>
              <p className="mt-2 text-sm leading-6 text-[#68676D]">
                Explore guided sessions, find the right intensity, and choose a workout that fits your day.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start rounded-2xl border border-white/80 bg-white/75 px-4 py-3 sm:self-auto">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CAECD6] text-[#28543B]">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 9v6M3.5 10.5v3M18 9v6M20.5 10.5v3M6 12h12M8 7v10M16 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-xl font-bold leading-none text-[#151517]">{libraryWorkouts.length}{libraryTotal > 0 ? <span className="text-sm font-semibold text-[#77717F]"> / {libraryTotal}</span> : null}</p>
                <p className="mt-1 text-xs text-[#77717F]">Workouts loaded</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]">
            <label className="relative block">
              <span className="sr-only">Search workouts</span>
              <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92879F]" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.7" />
                <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder="Search workouts or muscles..."
                className="w-full rounded-2xl border border-[#EAE3F0] bg-[#FCFAFE] py-3 pl-11 pr-12 text-sm text-[#302442] outline-none transition placeholder:text-[#A49AAE] focus:border-[#B99AD0] focus:ring-4 focus:ring-[#E4DBF4]/60"
              />
              {librarySearch && (
                <button
                  type="button"
                  onClick={() => setLibrarySearch('')}
                  aria-label="Clear workout search"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#92879F] transition hover:bg-[#E4DBF4] hover:text-[#493456]"
                >
                  ×
                </button>
              )}
            </label>
            <label className="block">
              <span className="sr-only">Filter by category</span>
              <select value={libraryCategory} onChange={(event) => setLibraryCategory(event.target.value)} className="w-full rounded-2xl border border-[#EAE3F0] bg-[#FCFAFE] px-4 py-3 text-sm text-[#5D496F] outline-none focus:border-[#B99AD0]">
                <option value="all">All categories</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="yoga">Yoga</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Filter by difficulty</span>
              <select value={libraryDifficulty} onChange={(event) => setLibraryDifficulty(event.target.value)} className="w-full rounded-2xl border border-[#EAE3F0] bg-[#FCFAFE] px-4 py-3 text-sm text-[#5D496F] outline-none focus:border-[#B99AD0]">
                <option value="all">All difficulty levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>

          {libraryError && (
            <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F0D5D5] bg-[#FFF8F8] p-4 text-sm text-[#9B4545]">
              <p>{libraryError}</p>
              <button type="button" onClick={() => {
                setLibraryCategory((current) => current)
                setLibraryDifficulty((current) => current)
                setLibraryLoading(true)
                getWorkoutLibrary({ page: 1, limit: 50, category: libraryCategory, difficulty: libraryDifficulty })
                  .then((response) => {
                    const items = response?.workouts ?? response?.data?.workouts ?? response?.data ?? []
                    setLibraryWorkouts(Array.isArray(items) ? items : [])
                    setLibraryError('')
                  })
                  .catch((err) => setLibraryError(err.response?.data?.message || 'Workout library could not be loaded. Please try again.'))
                  .finally(() => setLibraryLoading(false))
              }} className="font-semibold underline underline-offset-4">Try again</button>
            </div>
          )}

          {libraryLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse overflow-hidden rounded-3xl border border-[#EEE7F4]">
                  <div className="h-28 bg-[#F1EAF8]" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-1/3 rounded-full bg-[#EEE7F4]" />
                    <div className="h-5 w-2/3 rounded-full bg-[#EEE7F4]" />
                    <div className="h-3 rounded-full bg-[#F5F1F8]" />
                    <div className="h-3 w-4/5 rounded-full bg-[#F5F1F8]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLibraryWorkouts.length ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredLibraryWorkouts.map((item, index) => {
                const title = formatLibraryText(item.name || item.title || 'Workout')
                const description = formatLibraryText(item.description)
                const muscles = Array.isArray(item.targetMuscles) ? item.targetMuscles.filter(Boolean) : []
                const equipment = Array.isArray(item.equipment) ? item.equipment.filter(Boolean) : []
                const categoryName = formatLibraryLabel(item.category)
                const difficulty = formatLibraryLabel(item.difficulty || 'beginner')
                const duration = Number(item.durationMinutes) || 0
                const accents = [
                  'from-[#E4DBF4] to-[#F8E8F7]',
                  'from-[#CAECD6] to-[#F1F8F2]',
                  'from-[#FDC381]/70 to-[#FFF2E2]',
                  'from-[#F8E5F3] to-[#F5EFFA]',
                ]
                const fallbackImage = categoryFallbackImages[item.category] || categoryFallbackImages.other
                const workoutImage = getWorkoutImage(item)
                const workoutGif = findLibraryGif(item, exerciseGifIndex)
                return (
                  <article key={item._id ?? item.id ?? title} className="group flex min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#EEE7F4] bg-white shadow-[0_5px_20px_rgba(55,36,72,0.035)] transition duration-300 hover:-translate-y-1.5 hover:border-[#D7C5E5] hover:shadow-[0_22px_44px_rgba(55,36,72,0.12)]">
                    <div className={`relative flex h-44 items-end overflow-hidden bg-gradient-to-br ${accents[index % accents.length]} p-4 sm:h-48`}>
                      <img
                        src={workoutGif || workoutImage}
                        alt={`${title} workout demonstration`}
                        loading="lazy"
                        onError={(event) => {
                          if (workoutGif && event.currentTarget.src === workoutGif) {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = workoutImage
                          } else if (event.currentTarget.src !== fallbackImage) {
                            event.currentTarget.onerror = null
                            event.currentTarget.src = fallbackImage
                          }
                        }}
                        className={`absolute inset-0 h-full w-full transition duration-500 ${workoutGif ? "bg-[#F8F5FC] object-contain p-2" : "object-cover group-hover:scale-105"}`}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#151517]/45 via-transparent to-[#151517]/5" />
                      <div className="relative flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#493456]">{categoryName}</span>
                        <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#493456]">{difficulty}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-5">
                      <h3 className="line-clamp-2 min-h-[3.25rem] text-[17px] font-bold leading-6 text-[#302442] transition-colors group-hover:text-[#7855A6]">{title}</h3>
                      <p className="mt-2 line-clamp-3 min-h-[4.5rem] whitespace-pre-line text-sm leading-6 text-[#77717F]">
                        {description || 'A guided movement session to support your training routine.'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F5FC] px-3 py-2 text-xs font-semibold text-[#655472]">
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                          {duration ? `${duration} min` : 'Flexible duration'}
                        </span>
                        {muscles.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F5FC] px-3 py-2 text-xs font-semibold text-[#655472]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M7 8v8M4 10v4M17 8v8M20 10v4M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                            {muscles.length} target {muscles.length === 1 ? 'area' : 'areas'}
                          </span>
                        )}
                      </div>
                      {muscles.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {muscles.slice(0, 3).map((muscle) => (
                            <span key={muscle} className="rounded-full bg-[#F0F8F2] px-2.5 py-1 text-[11px] font-medium capitalize text-[#41664E]">{formatLibraryLabel(muscle)}</span>
                          ))}
                          {muscles.length > 3 && <span className="rounded-full bg-[#F8F5FC] px-2.5 py-1 text-[11px] text-[#77717F]">+{muscles.length - 3} more</span>}
                        </div>
                      )}
                      <button type="button" onClick={() => setSelectedLibraryWorkout(item)} className="mt-5 flex w-full items-center justify-between rounded-xl bg-[#151517] px-4 py-3.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#7855A6] focus:outline-none focus:ring-4 focus:ring-[#E4DBF4]">
                        <span>View workout details</span><span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
            {libraryWorkouts.length < libraryTotal && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-xs text-[#92879F]">
                  Showing {libraryWorkouts.length} of {libraryTotal} workouts
                </p>
                <button
                  type="button"
                  onClick={handleLoadMoreLibrary}
                  disabled={libraryLoadingMore}
                  className="rounded-xl bg-[#332743] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#4A365D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {libraryLoadingMore ? 'Loading more workouts...' : 'Load more workouts'}
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-[#DCCFE7] bg-[#FCFAFE] px-5 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4DBF4] text-[#69527D]">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true"><path d="M6 9v6M3.5 10.5v3M18 9v6M20.5 10.5v3M6 12h12M8 7v10M16 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </span>
              <h3 className="mt-4 font-bold text-[#302442]">No matching workouts</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77717F]">
                Try a different keyword, category or difficulty—or reset all filters to explore the full library.
              </p>
              <button type="button" onClick={() => { setLibrarySearch(''); setLibraryCategory('all'); setLibraryDifficulty('all') }} className="mt-4 rounded-full border border-[#E4DBF4] px-4 py-2 text-sm font-semibold text-[#735A86] transition hover:bg-[#F8F5FC]">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedLibraryWorkout && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#21172D]/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={(event) => { if (event.target === event.currentTarget) setSelectedLibraryWorkout(null) }}
          onKeyDown={(event) => { if (event.key === 'Escape') setSelectedLibraryWorkout(null) }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="library-workout-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-white/70 bg-[#FCFAFE] shadow-2xl sm:rounded-[28px]">
            <div className="relative overflow-hidden bg-[#E4DBF4] px-5 py-6 sm:px-7">
              <div className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-[#F373D4]/20 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#806991]">Workout guide</p>
                  <h2 id="library-workout-title" className="mt-2 text-2xl font-bold text-[#151517] sm:text-3xl">{formatLibraryText(selectedLibraryWorkout.name || selectedLibraryWorkout.title || 'Workout')}</h2>
                  <p className="mt-2 text-sm text-[#68676D]">{formatLibraryLabel(selectedLibraryWorkout.category)} · {formatLibraryLabel(selectedLibraryWorkout.difficulty || 'beginner')} · {Number(selectedLibraryWorkout.durationMinutes) || 15} min</p>
                </div>
                <button type="button" aria-label="Close workout details" onClick={() => setSelectedLibraryWorkout(null)} className="shrink-0 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-[#493456] transition hover:bg-white">✕</button>
              </div>
            </div>
            <div className="space-y-6 p-5 sm:p-7">
              {findLibraryGif(selectedLibraryWorkout, exerciseGifIndex) ? (
                <section className="overflow-hidden rounded-2xl border border-[#E6D9EF] bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#F0EAF4] bg-[#FCFAFE] px-4 py-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#302442]">Animated exercise demo</h3>
                      <p className="mt-1 text-xs text-[#92879F]">Watch the movement before you begin</p>
                    </div>
                    <span className="rounded-full bg-[#CAECD6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#315B3D]">GIF</span>
                  </div>
                  <div className="flex justify-center bg-[#F8F5FC] p-3 sm:p-5">
                    <img
                      src={findLibraryGif(selectedLibraryWorkout, exerciseGifIndex)}
                      alt={`${formatLibraryText(selectedLibraryWorkout.name || selectedLibraryWorkout.title || 'Workout')} animated exercise demonstration`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = getWorkoutImage({ ...selectedLibraryWorkout, imageUrl: undefined })
                      }}
                      className="max-h-[360px] w-full max-w-sm rounded-xl object-contain"
                    />
                  </div>
                </section>
              ) : (
                <section className="overflow-hidden rounded-2xl border border-[#E6D9EF] bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#F0EAF4] bg-[#FCFAFE] px-4 py-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#302442]">Exercise demonstration</h3>
                      <p className="mt-1 text-xs text-[#92879F]">Visual reference for this movement</p>
                    </div>
                    <span className="rounded-full bg-[#FDC381]/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#76502A]">Image preview</span>
                  </div>
                  <img
                    src={getWorkoutImage({ ...selectedLibraryWorkout, imageUrl: undefined })}
                    alt={`${formatLibraryText(selectedLibraryWorkout.name || selectedLibraryWorkout.title || 'Workout')} preview`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = categoryFallbackImages[selectedLibraryWorkout.category] || categoryFallbackImages.other
                    }}
                    className="h-48 w-full object-cover sm:h-60"
                  />
                  <p className="px-4 py-3 text-xs leading-5 text-[#77717F]">An animated GIF will appear here when this exercise has a GIF URL in the workout library data.</p>
                </section>
              )}
              {selectedLibraryWorkout.description && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#806991]">About this workout</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#68676D]">{formatLibraryText(selectedLibraryWorkout.description)}</p>
                </section>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl border border-[#E5F0E8] bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-[#302442]">Target muscles</h3>
                  {Array.isArray(selectedLibraryWorkout.targetMuscles) && selectedLibraryWorkout.targetMuscles.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">{selectedLibraryWorkout.targetMuscles.map((muscle) => <span key={muscle} className="rounded-full bg-[#CAECD6] px-3 py-1.5 text-xs font-semibold capitalize text-[#315B3D]">{formatLibraryLabel(muscle)}</span>)}</div>
                  ) : <p className="mt-2 text-sm text-[#92879F]">Not specified</p>}
                </section>
                <section className="rounded-2xl border border-[#F3E4D3] bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-[#302442]">Equipment</h3>
                  {Array.isArray(selectedLibraryWorkout.equipment) && selectedLibraryWorkout.equipment.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">{selectedLibraryWorkout.equipment.map((gear) => <span key={gear} className="rounded-full bg-[#FDC381]/40 px-3 py-1.5 text-xs font-semibold capitalize text-[#76502A]">{formatLibraryLabel(gear)}</span>)}</div>
                  ) : <p className="mt-2 text-sm text-[#92879F]">No equipment details provided</p>}
                </section>
              </div>
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#806991]">How to do it</h3>
                  <span className="rounded-full bg-[#F0EAF7] px-3 py-1 text-xs font-semibold text-[#735A86]">{Array.isArray(selectedLibraryWorkout.instructions) ? selectedLibraryWorkout.instructions.length : 0} steps</span>
                </div>
                {Array.isArray(selectedLibraryWorkout.instructions) && selectedLibraryWorkout.instructions.length ? (
                  <ol className="mt-4 space-y-3">
                    {selectedLibraryWorkout.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-3 rounded-2xl border border-[#EEE7F4] bg-white p-4 transition-colors hover:border-[#DCCBE9] hover:bg-[#FDFBFE]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E4DBF4] text-xs font-bold text-[#493456]">{String(index + 1).padStart(2, '0')}</span>
                        <p className="pt-1 text-sm leading-6 text-[#68676D]">{formatLibraryText(instruction)}</p>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-3 rounded-2xl bg-white p-4 text-sm leading-6 text-[#92879F]">Step-by-step instructions have not been added for this workout yet.</p>}
              </section>
              {selectedLibraryWorkout.videoUrl && (
                <a href={selectedLibraryWorkout.videoUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#151517] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#34343A]">
                  Watch exercise video <span aria-hidden="true">↗</span>
                </a>
              )}
              {libraryAddMessage && (
                <p role="status" className="rounded-xl border border-[#CDE8D5] bg-[#F0F8F2] px-4 py-3 text-sm font-semibold text-[#315B3D]">
                  {libraryAddMessage}
                </p>
              )}
              {libraryAddError && (
                <p role="alert" className="rounded-xl border border-[#F1D1DC] bg-[#FFF5F8] px-4 py-3 text-sm font-semibold text-[#A45172]">
                  {libraryAddError}
                </p>
              )}
              <button
                type="button"
                onClick={handleAddLibraryWorkoutToDaily}
                disabled={addingLibraryWorkout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7855A6] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#604184] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingLibraryWorkout ? 'Adding to daily workout...' : '＋ Add to Daily Workout'}
              </button>
              <button type="button" onClick={() => setSelectedLibraryWorkout(null)} className="w-full rounded-xl border border-[#E5DCEB] bg-white px-4 py-3 text-sm font-semibold text-[#493456] transition hover:bg-[#F8F5FC]">Close details</button>
            </div>
          </section>
        </div>
      )}

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
