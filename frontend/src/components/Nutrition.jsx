
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addNutritionEntry,
  searchNutritionFoods,
  getFoodNutrition,
  getTodayNutrition,
  getNutritionGoalsProgress,
  saveNutritionGoals,
} from '../services/nutritionService'
import {
  addHydrationEntry,
  getTodayHydration,
  getHydrationHistory,
} from '../services/hydrationService'

const WATER_GOAL = 2500

const defaultGoals = {
  caloriesKcal: 2000,
  proteinG: 100,
  carbohydratesG: 250,
  fatG: 70,
}

const mealOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const mealSuggestions = [
  { name: 'Oats with milk', calories: 280, protein: 12, carbohydrates: 40, fat: 8, type: 'Breakfast' },
  { name: 'Eggs and whole wheat toast', calories: 320, protein: 20, carbohydrates: 28, fat: 12, type: 'Breakfast' },
  { name: 'Rice, dal and vegetables', calories: 450, protein: 16, carbohydrates: 70, fat: 10, type: 'Lunch' },
  { name: 'Paneer with roti', calories: 420, protein: 24, carbohydrates: 40, fat: 18, type: 'Dinner' },
  { name: 'Banana and almonds', calories: 190, protein: 5, carbohydrates: 27, fat: 9, type: 'Snack' },
  { name: 'Greek yogurt', calories: 130, protein: 12, carbohydrates: 9, fat: 5, type: 'Snack' },
]

const beverages = [
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'electrolyte', label: 'Electrolyte', icon: '⚡' },
  { value: 'milk', label: 'Milk', icon: '🥛' },
  { value: 'juice', label: 'Juice', icon: '🧃' },
  { value: 'other', label: 'Other', icon: '🥤' },
]

function getToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  )
}


function normalizeFoodResults(response) {
  const candidates = [
    response?.data?.foods,
    response?.data?.results,
    response?.foods,
    response?.results,
    response?.data,
  ]

  return candidates.find(Array.isArray) || []
}

function getNutrientAmount(food, patterns, fallbackKeys = []) {
  const nutrients = [
    ...(Array.isArray(food?.foodNutrients) ? food.foodNutrients : []),
    ...(Array.isArray(food?.nutrients) ? food.nutrients : []),
    ...(Array.isArray(food?.data?.foodNutrients) ? food.data.foodNutrients : []),
    ...(Array.isArray(food?.data?.nutrients) ? food.data.nutrients : []),
  ]

  for (const nutrient of nutrients) {
    const name = String(
      nutrient?.nutrientName || nutrient?.name || nutrient?.nutrient?.name || ''
    ).toLowerCase()
    if (patterns.some((pattern) => pattern.test(name))) {
      const value = Number(nutrient?.value ?? nutrient?.amount ?? nutrient?.nutrient?.amount)
      if (Number.isFinite(value)) return value
    }
  }

  for (const key of fallbackKeys) {
    const value = Number(food?.[key] ?? food?.data?.[key])
    if (Number.isFinite(value)) return value
  }

  return 0
}

function extractFoodMacros(response) {
  const food = response?.data?.food || response?.data || response?.food || response
  return {
    calories: getNutrientAmount(food, [/energy/, /calorie/], ['calories', 'caloriesKcal', 'energyKcal']),
    protein: getNutrientAmount(food, [/^protein/, /protein/], ['protein', 'proteinG']),
    carbohydrates: getNutrientAmount(food, [/carbohydrate/, /carbohydrates/], ['carbohydrates', 'carbs', 'carbohydratesG']),
    fat: getNutrientAmount(food, [/total lipid/, /^fat/, /total fat/], ['fat', 'fatG', 'totalFat']),
  }
}

function StatCard({ label, value, unit, detail, icon, color }) {
  return (
    <div className="rounded-2xl border border-[#EAE3F2] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#7E7E82]">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#151517]">{value}</span>
        <span className="text-sm text-[#7E7E82]">{unit}</span>
      </div>
      <p className="mt-2 text-xs text-[#7E7E82]">{detail}</p>
    </div>
  )
}

function ProgressRow({ label, value, goal, unit, color }) {
  const percentage = goal > 0
    ? Math.min((Number(value || 0) / goal) * 100, 100)
    : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-[#7E7E82]">
          {Number(value || 0).toFixed(1)} / {goal} {unit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#F2EAF8]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function HydrationChart({ history }) {
  const days = [...history].slice(-7)

  const maxValue = Math.max(
    1000,
    ...days.map((day) => Number(day.totalMl) || 0)
  )

  const chartWidth = 560
  const chartHeight = 190
  const left = 42
  const right = 12
  const top = 18
  const bottom = 32
  const plotWidth = chartWidth - left - right
  const plotHeight = chartHeight - top - bottom
  const slotWidth = plotWidth / Math.max(days.length, 1)
  const barWidth = Math.min(34, slotWidth * 0.55)

  const points = days.map((day, index) => {
    const value = Number(day.totalMl) || 0
    const x = left + (index + 0.5) * slotWidth
    const barHeight = (value / maxValue) * plotHeight

    return {
      ...day,
      value,
      x,
      y: top + plotHeight - barHeight,
      barHeight,
    }
  })

  return (
    <div className="mt-6 rounded-2xl bg-[#FBF9FD] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#151517]">Your hydration week</h3>
          <p className="mt-1 text-xs text-[#7E7E82]">
            Daily fluid intake from your account
          </p>
        </div>
        <span className="rounded-full bg-[#E4DBF4] px-3 py-1.5 text-xs font-semibold text-[#60428A]">
          Last 7 days
        </span>
      </div>

      {days.length === 0 ? (
        <div className="py-10 text-center">
          <span className="text-3xl">📊</span>
          <p className="mt-3 text-sm text-[#7E7E82]">
            Your weekly graph will appear when history loads.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label="Bar chart showing daily fluid intake in millilitres"
              className="w-full overflow-visible"
            >
              {[0, 0.5, 1].map((fraction) => {
                const y = top + plotHeight * fraction
                const label = Math.round(maxValue * (1 - fraction))

                return (
                  <g key={fraction}>
                    <line
                      x1={left}
                      x2={chartWidth - right}
                      y1={y}
                      y2={y}
                      stroke="#E6DDED"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={left - 8}
                      y={y + 4}
                      fontSize="10"
                      textAnchor="end"
                      fill="#8A8490"
                    >
                      {label >= 1000
                        ? `${(label / 1000).toFixed(label % 1000 ? 1 : 0)}k`
                        : label}
                    </text>
                  </g>
                )
              })}

              {points.map((point) => {
                const dayLabel = new Date(
                  `${point.date}T12:00:00Z`
                ).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  timeZone: 'UTC',
                })

                return (
                  <g key={point.date} className="group">
                    <title>
                      {point.date}: {point.value} ml, {point.entryCount || 0} drinks
                    </title>
                    <rect
                      x={point.x - barWidth / 2}
                      y={point.y}
                      width={barWidth}
                      height={Math.max(point.barHeight, 0)}
                      rx="7"
                      fill={point.value > 0 ? '#B58BDC' : '#E4DBF4'}
                      className="transition-opacity duration-200 hover:opacity-70"
                    />
                    {point.value > 0 && (
                      <text
                        x={point.x}
                        y={Math.max(point.y - 6, 10)}
                        fontSize="10"
                        textAnchor="middle"
                        fill="#60428A"
                      >
                        {point.value >= 1000
                          ? `${(point.value / 1000).toFixed(1)}L`
                          : point.value}
                      </text>
                    )}
                    <text
                      x={point.x}
                      y={chartHeight - 10}
                      fontSize="10"
                      textAnchor="middle"
                      fill="#7E7E82"
                    >
                      {dayLabel}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {points.map((point) => (
              <div key={point.date} className="rounded-xl border border-[#F0EBF5] bg-white p-3">
                <p className="text-xs text-[#7E7E82]">{point.date}</p>
                <p className="mt-1 text-sm font-bold text-[#151517]">
                  {point.value.toLocaleString()} ml
                </p>
                <p className="mt-1 text-xs text-[#7E7E82]">
                  {point.entryCount || 0} drinks
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Nutrition() {
  const [nutrition, setNutrition] = useState({
    date: getToday(),
    entryCount: 0,
    totals: { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
    entries: [],
  })

  const [goals, setGoals] = useState(null)
  const [goalForm, setGoalForm] = useState(defaultGoals)

  const [hydration, setHydration] = useState({
    date: getToday(),
    totalMl: 0,
    entryCount: 0,
    entries: [],
  })
  const [hydrationHistory, setHydrationHistory] = useState([])
  const [beverageType, setBeverageType] = useState('water')
  const [waterAmount, setWaterAmount] = useState('250')

  const [mealType, setMealType] = useState('Breakfast')
  const [mealName, setMealName] = useState('')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState([])
  const [searchingFoods, setSearchingFoods] = useState(false)
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [foodNutritionPer100g, setFoodNutritionPer100g] = useState(null)
  const [loadingFoodNutrition, setLoadingFoodNutrition] = useState(false)
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbohydrates, setCarbohydrates] = useState('')
  const [fat, setFat] = useState('')
  const [servingSize, setServingSize] = useState('1')
  const [servingUnit, setServingUnit] = useState('serving')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingMeal, setSavingMeal] = useState(false)
  const [savingGoals, setSavingGoals] = useState(false)
  const [savingWater, setSavingWater] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showGoalEditor, setShowGoalEditor] = useState(false)

  const totals = nutrition.totals || {}
  const entries = Array.isArray(nutrition.entries) ? nutrition.entries : []
  const hydrationEntries = Array.isArray(hydration.entries) ? hydration.entries : []
  const water = Number(hydration.totalMl) || 0

  const totalCalories = Number(totals.calories) || 0
  const totalProtein = Number(totals.protein) || 0
  const totalCarbohydrates = Number(totals.carbohydrates) || 0
  const totalFat = Number(totals.fat) || 0

  const calorieGoal = Number(goals?.caloriesKcal) || defaultGoals.caloriesKcal
  const proteinGoal = Number(goals?.proteinG) || defaultGoals.proteinG
  const carbsGoal = Number(goals?.carbohydratesG) || defaultGoals.carbohydratesG
  const fatGoal = Number(goals?.fatG) || defaultGoals.fatG

  const waterProgress = Math.min((water / WATER_GOAL) * 100, 100)

  const loadNutrition = useCallback(async () => {
    setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      getTodayNutrition(),
      getNutritionGoalsProgress(),
      getTodayHydration(),
      getHydrationHistory(7),
    ])

    const [
      todayResult,
      goalsResult,
      hydrationResult,
      historyResult,
    ] = results

    const errors = []

    if (todayResult.status === 'fulfilled') {
      setNutrition(todayResult.value)
    } else {
      errors.push(getErrorMessage(todayResult.reason, 'Could not load nutrition data.'))
    }

    if (goalsResult.status === 'fulfilled') {
      const progressData = goalsResult.value
      const savedGoals = progressData?.goals

      if (savedGoals) {
        setGoals(savedGoals)
        setGoalForm({
          caloriesKcal: savedGoals.caloriesKcal ?? defaultGoals.caloriesKcal,
          proteinG: savedGoals.proteinG ?? defaultGoals.proteinG,
          carbohydratesG: savedGoals.carbohydratesG ?? defaultGoals.carbohydratesG,
          fatG: savedGoals.fatG ?? defaultGoals.fatG,
        })
      } else {
        setGoals(null)
        setGoalForm(defaultGoals)
      }
    } else {
      errors.push(getErrorMessage(goalsResult.reason, 'Could not load nutrition goals.'))
    }

    if (hydrationResult.status === 'fulfilled') {
      setHydration(hydrationResult.value)
    } else {
      errors.push(getErrorMessage(hydrationResult.reason, 'Could not load today’s hydration.'))
    }

    if (historyResult.status === 'fulfilled') {
      setHydrationHistory(
        Array.isArray(historyResult.value?.history)
          ? historyResult.value.history
          : []
      )
    } else {
      errors.push(getErrorMessage(historyResult.reason, 'Could not load hydration history.'))
    }

    if (errors.length) setError(errors.join(' '))

    setLoading(false)
  }, [])

  useEffect(() => {
    loadNutrition()
  }, [loadNutrition])

  async function addWater(amount) {
    setMessage('')
    setError('')

    if (!Number.isFinite(amount) || amount < 1 || amount > 20000) {
      setError('Enter an amount between 1 and 20000 ml.')
      return
    }

    setSavingWater(true)

    try {
      await addHydrationEntry({
        date: getToday(),
        amountMl: amount,
        beverageType,
        notes: `Added from FitNect ${beverageType} tracker`,
      })

      setMessage(`${amount.toLocaleString()} ml ${beverageType} saved successfully.`)
      await loadNutrition()
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save drink. Please try again.'))
    } finally {
      setSavingWater(false)
    }
  }


  async function handleFoodSearch() {
    const query = foodSearch.trim()
    if (query.length < 2) {
      setError('Enter at least 2 characters to search foods.')
      return
    }

    setError('')
    setMessage('')
    setSearchingFoods(true)
    setFoodResults([])

    try {
      const response = await searchNutritionFoods(query)
      const results = normalizeFoodResults(response)
      setFoodResults(results)
      if (!results.length) setMessage('No foods found. Try another search term.')
    } catch (err) {
      setError(getErrorMessage(err, 'Food search is unavailable right now.'))
    } finally {
      setSearchingFoods(false)
    }
  }

  async function handleSelectFood(food) {
    const fdcId = food?.fdcId ?? food?.fdc_id ?? food?.id
    if (!fdcId) {
      setError('This food result has no usable food ID. Please choose another result.')
      return
    }

    setError('')
    setMessage('')
    setLoadingFoodNutrition(true)
    setSelectedFoodId(String(fdcId))

    try {
      const response = await getFoodNutrition(fdcId)
      const macros = extractFoodMacros(response)
      const foodName = food?.description || food?.name || food?.foodName || food?.title || 'Selected food'

      setMealName(foodName)
      setFoodNutritionPer100g(macros)
      setCalories(String(Number(macros.calories.toFixed(2))))
      setProtein(String(Number(macros.protein.toFixed(2))))
      setCarbohydrates(String(Number(macros.carbohydrates.toFixed(2))))
      setFat(String(Number(macros.fat.toFixed(2))))
      setServingSize('100')
      setServingUnit('g')
      setFoodResults([])
      setMessage('Nutrition values loaded for 100 g. Adjust the serving size before saving.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load nutrition values for this food.'))
    } finally {
      setLoadingFoodNutrition(false)
      setSelectedFoodId('')
    }
  }

  async function addMeal(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (
      !mealName.trim() ||
      calories === '' ||
      protein === '' ||
      carbohydrates === '' ||
      fat === ''
    ) {
      setError('Enter the meal name, calories and all macronutrient values.')
      return
    }

    const values = [calories, protein, carbohydrates, fat, servingSize].map(Number)

    if (
      values.some((value) => !Number.isFinite(value) || value < 0) ||
      Number(calories) > 10000 ||
      Number(protein) > 1000 ||
      Number(carbohydrates) > 2000 ||
      Number(fat) > 1000 ||
      Number(servingSize) <= 0
    ) {
      setError('Enter valid nutrition values and a serving size greater than zero.')
      return
    }

    setSavingMeal(true)

    try {
      const portionMultiplier = foodNutritionPer100g && servingUnit === 'g'
        ? Number(servingSize) / 100
        : 1

      await addNutritionEntry({
        date: getToday(),
        foodName: mealName.trim(),
        mealType: mealType.toLowerCase(),
        servingSize: Number(servingSize),
        servingUnit,
        calories: Number(calories) * portionMultiplier,
        protein: Number(protein) * portionMultiplier,
        carbohydrates: Number(carbohydrates) * portionMultiplier,
        fat: Number(fat) * portionMultiplier,
        notes: notes.trim(),
      })

      setMealName('')
      setCalories('')
      setProtein('')
      setCarbohydrates('')
      setFat('')
      setServingSize('1')
      setServingUnit('serving')
      setNotes('')
      setMessage('Meal saved successfully!')
      await loadNutrition()
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save meal. Please try again.'))
    } finally {
      setSavingMeal(false)
    }
  }

  async function addSuggestion(meal) {
    setMessage('')
    setError('')
    setSavingMeal(true)

    try {
      await addNutritionEntry({
        date: getToday(),
        foodName: meal.name,
        mealType: meal.type.toLowerCase(),
        servingSize: 1,
        servingUnit: 'serving',
        calories: meal.calories,
        protein: meal.protein,
        carbohydrates: meal.carbohydrates,
        fat: meal.fat,
        notes: 'Added from meal suggestions',
      })

      setMessage(`${meal.name} added to your diary.`)
      await loadNutrition()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add this meal.'))
    } finally {
      setSavingMeal(false)
    }
  }

  async function handleSaveGoals(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const values = Object.values(goalForm).map(Number)

    if (
      values.some((value) => !Number.isFinite(value) || value < 0) ||
      Number(goalForm.caloriesKcal) <= 0
    ) {
      setError('Calories must be greater than zero. Other goals cannot be negative.')
      return
    }

    setSavingGoals(true)

    try {
      await saveNutritionGoals({
        caloriesKcal: Number(goalForm.caloriesKcal),
        proteinG: Number(goalForm.proteinG),
        carbohydratesG: Number(goalForm.carbohydratesG),
        fatG: Number(goalForm.fatG),
      })

      setMessage('Your nutrition goals have been saved.')
      setShowGoalEditor(false)
      await loadNutrition()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your goals.'))
    } finally {
      setSavingGoals(false)
    }
  }

  const weeklyInsights = useMemo(() => {
    const total = hydrationHistory.reduce(
      (sum, day) => sum + (Number(day.totalMl) || 0),
      0
    )

    const average = hydrationHistory.length
      ? total / hydrationHistory.length
      : 0

    const bestDay = hydrationHistory.reduce((best, day) => {
      if (!best || Number(day.totalMl) > Number(best.totalMl)) return day
      return best
    }, null)

    return { total, average, bestDay }
  }, [hydrationHistory])

  const progressRows = useMemo(() => [
    { label: 'Calories', value: totalCalories, goal: calorieGoal, unit: 'kcal', color: 'bg-[#B58BDC]' },
    { label: 'Protein', value: totalProtein, goal: proteinGoal, unit: 'g', color: 'bg-[#94D4AE]' },
    { label: 'Carbohydrates', value: totalCarbohydrates, goal: carbsGoal, unit: 'g', color: 'bg-[#FDC381]' },
    { label: 'Fat', value: totalFat, goal: fatGoal, unit: 'g', color: 'bg-[#F373D4]' },
  ], [
    totalCalories,
    totalProtein,
    totalCarbohydrates,
    totalFat,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
  ])

  return (
    <div className="min-h-screen bg-[#F8F5FC] px-4 py-6 text-[#151517] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        <section className="relative overflow-hidden rounded-[28px] bg-[#E4DBF4] p-6 sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#FDC381]/50 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-white/50 blur-2xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#60428A]">
                <span className="h-2 w-2 rounded-full bg-[#8C68BC]" />
                YOUR DAILY NOURISHMENT
              </span>

              <h1 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Fuel your body.
                <br />
                <span className="text-[#7652A6]">Feel your best.</span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-6 text-[#62596D] sm:text-base">
                Track your food, record your drinks and understand your daily intake.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#meal-logger" className="rounded-xl bg-[#151517] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#35323A]">
                  + Log a meal
                </a>
                <a href="#hydration" className="rounded-xl border border-white/80 bg-white/70 px-5 py-3 text-sm font-semibold text-[#51465E] transition hover:bg-white">
                  Track hydration
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xs">
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-lg shadow-[#927BB3]/10 backdrop-blur-sm">
                <p className="text-sm font-medium text-[#7E7E82]">Today's nutrition</p>
                <p className="mt-1 text-2xl font-bold">{totalCalories.toLocaleString()} kcal</p>
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#EDE7F5]">
                  <div
                    className="h-full rounded-full bg-[#B58BDC] transition-all duration-500"
                    style={{ width: `${Math.min((totalCalories / calorieGoal) * 100, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between gap-2 text-xs text-[#7E7E82]">
                  <span>Daily calorie goal</span>
                  <span>{calorieGoal.toLocaleString()} kcal</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F3EDF9] p-3">
                    <p className="text-xs text-[#7E7E82]">Protein</p>
                    <p className="mt-1 text-lg font-bold">{totalProtein.toFixed(1)} g</p>
                  </div>
                  <div className="rounded-2xl bg-[#E7F5EB] p-3">
                    <p className="text-xs text-[#668071]">Fluid intake</p>
                    <p className="mt-1 text-lg font-bold">{(water / 1000).toFixed(2)} L</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        {message && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E4DBF4] bg-white px-5 py-4 text-sm text-[#60428A] shadow-sm">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} className="font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-[#EAE3F2] bg-white p-10 text-center text-sm text-[#7E7E82]">
            Loading your wellness data...
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Calories consumed" value={totalCalories.toLocaleString()} unit="kcal" detail={`${Math.max(calorieGoal - totalCalories, 0).toLocaleString()} kcal remaining to goal`} icon="🔥" color="bg-[#FDE8D5]" />
              <StatCard label="Protein intake" value={totalProtein.toFixed(1)} unit="g" detail={`${Math.max(proteinGoal - totalProtein, 0).toFixed(1)} g remaining to goal`} icon="🥚" color="bg-[#E4DBF4]" />
              <StatCard label="Fluid intake" value={(water / 1000).toFixed(2)} unit="L" detail={`${Math.max(WATER_GOAL - water, 0).toLocaleString()} ml to demo target`} icon="💧" color="bg-[#DCEFE5]" />
              <StatCard label="Meals logged" value={nutrition.entryCount ?? entries.length} unit="meals" detail="Entries recorded today" icon="🍽️" color="bg-[#FCE4F5]" />
            </section>

            <section id="hydration" className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-[#EAE3F2] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-[#8B7A9D]">DAILY WELLNESS</p>
                    <h2 className="mt-2 text-2xl font-bold">Hydration tracker</h2>
                    <p className="mt-1 text-sm text-[#7E7E82]">Track the drinks you record throughout your day.</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F5EB] text-2xl">💧</div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div
                    className="relative flex h-36 w-36 items-center justify-center justify-self-center rounded-full"
                    style={{ background: `conic-gradient(#B58BDC ${waterProgress}%, #F0EBF5 ${waterProgress}% 100%)` }}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-2xl font-bold">{Math.round(waterProgress)}%</span>
                      <span className="mt-1 text-xs text-[#7E7E82]">of demo target</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F8F5FC] p-5">
                    <p className="text-sm text-[#7E7E82]">Today's total fluid intake</p>
                    <p className="mt-2 text-3xl font-bold">
                      {(water / 1000).toFixed(2)}
                      <span className="ml-2 text-sm font-medium text-[#7E7E82]">litres</span>
                    </p>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#EAE3F2]">
                      <div className="h-full rounded-full bg-[#B58BDC] transition-all duration-500" style={{ width: `${waterProgress}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#7E7E82]">
                      <span>{water.toLocaleString()} ml recorded</span>
                      <span>{Math.max(WATER_GOAL - water, 0).toLocaleString()} ml to demo target</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7">
                  <label className="mb-3 block text-sm font-semibold">What are you drinking?</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {beverages.map((drink) => (
                      <button
                        key={drink.value}
                        type="button"
                        onClick={() => setBeverageType(drink.value)}
                        className={`rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 ${
                          beverageType === drink.value
                            ? 'border-[#B58BDC] bg-[#F3EDF9] ring-2 ring-[#E4DBF4]'
                            : 'border-[#EAE3F2] bg-white hover:bg-[#FBF9FD]'
                        }`}
                      >
                        <span className="text-xl">{drink.icon}</span>
                        <span className="mt-2 block text-xs font-semibold">{drink.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-semibold">Quick add</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[150, 250, 500].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        disabled={savingWater}
                        onClick={() => addWater(amount)}
                        className="rounded-xl border border-[#E5E1EC] bg-[#FBF9FD] px-3 py-3 text-sm font-semibold transition hover:border-[#B99BDE] hover:bg-[#F2EAFB] disabled:opacity-50"
                      >
                        +{amount} ml
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max="20000"
                    value={waterAmount}
                    onChange={(event) => setWaterAmount(event.target.value)}
                    aria-label="Custom drink amount in millilitres"
                    placeholder="Custom amount (ml)"
                    className="min-w-0 flex-1 rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                  />
                  <button
                    type="button"
                    disabled={savingWater}
                    onClick={() => {
                      const amount = Number(waterAmount)
                      if (Number.isFinite(amount) && amount >= 1 && amount <= 20000) {
                        addWater(amount)
                        setWaterAmount('250')
                      } else {
                        setError('Enter an amount between 1 and 20000 ml.')
                      }
                    }}
                    className="rounded-xl bg-[#151517] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#35323A] disabled:opacity-50"
                  >
                    {savingWater ? 'Saving...' : 'Add drink'}
                  </button>
                </div>

                <p className="mt-4 text-xs leading-5 text-[#8A8490]">
                  Your drink entries are saved to your FitNect account. The 2.5 L target is a demo setting, not a universal recommendation.
                </p>

                <HydrationChart history={hydrationHistory} />

                <div className="mt-7">
                  <h3 className="font-bold">Today's drinks</h3>
                  <p className="mt-1 text-sm text-[#7E7E82]">Individual entries returned by the hydration API.</p>

                  {hydrationEntries.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#DDD2EA] p-6 text-center">
                      <p className="text-2xl">🥤</p>
                      <p className="mt-2 text-sm font-semibold">No drinks recorded yet</p>
                      <p className="mt-1 text-xs text-[#7E7E82]">Add your first drink to start tracking.</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {hydrationEntries.map((drink, index) => {
                        const beverage = beverages.find((item) => item.value === drink.beverageType)

                        return (
                          <div
                            key={drink._id || drink.id || `${drink.amountMl}-${index}`}
                            className="flex items-center gap-3 rounded-2xl border border-[#F0EBF5] p-4 transition hover:bg-[#FBF9FD]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F5EB]">
                              {beverage?.icon || '🥤'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold capitalize">{drink.beverageType || 'Drink'}</p>
                              <p className="mt-1 break-words text-xs text-[#7E7E82]">{drink.notes || 'Hydration entry'}</p>
                            </div>
                            <span className="shrink-0 text-sm font-bold">{Number(drink.amountMl) || 0} ml</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
                  <div>
                    <p className="text-sm font-medium text-[#8B7A9D]">WEEKLY INSIGHTS</p>
                    <h2 className="mt-1 text-xl font-bold">Your hydration week</h2>
                    <p className="mt-2 text-sm text-[#7E7E82]">Insights calculated from recorded intake.</p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-[#E7F5EB] p-4">
                      <p className="text-sm text-[#668071]">Weekly fluid total</p>
                      <p className="mt-1 text-2xl font-bold">{(weeklyInsights.total / 1000).toFixed(2)} L</p>
                      <p className="mt-1 text-xs text-[#668071]">Across {hydrationHistory.length} days</p>
                    </div>

                    <div className="rounded-2xl bg-[#F3EDF9] p-4">
                      <p className="text-sm text-[#745496]">Daily average</p>
                      <p className="mt-1 text-2xl font-bold">{Math.round(weeklyInsights.average).toLocaleString()} ml</p>
                      <p className="mt-1 text-xs text-[#745496]">Includes days with zero intake</p>
                    </div>

                    <div className="rounded-2xl bg-[#FFF0DF] p-4">
                      <p className="text-sm text-[#94734D]">Highest recorded day</p>
                      <p className="mt-1 text-2xl font-bold">
                        {weeklyInsights.bestDay
                          ? `${(Number(weeklyInsights.bestDay.totalMl) / 1000).toFixed(2)} L`
                          : '—'}
                      </p>
                      <p className="mt-1 text-xs text-[#94734D]">
                        {weeklyInsights.bestDay?.date || 'No history yet'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#8B7A9D]">DAILY TARGETS</p>
                      <h2 className="mt-1 text-xl font-bold">Nutrition overview</h2>
                      <p className="mt-2 text-sm text-[#7E7E82]">Compare intake with your saved goals.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGoalEditor(!showGoalEditor)}
                      className="rounded-xl border border-[#E4DBF4] px-3 py-2 text-sm font-semibold text-[#745496] hover:bg-[#F8F5FC]"
                    >
                      {showGoalEditor ? 'Cancel' : 'Edit goals'}
                    </button>
                  </div>

                  {showGoalEditor && (
                    <form onSubmit={handleSaveGoals} className="mt-5 space-y-4 rounded-2xl bg-[#FBF7FF] p-4">
                      {[
                        ['caloriesKcal', 'Calories (kcal)'],
                        ['proteinG', 'Protein (g)'],
                        ['carbohydratesG', 'Carbohydrates (g)'],
                        ['fatG', 'Fat (g)'],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <label htmlFor={key} className="mb-1.5 block text-sm font-medium">{label}</label>
                          <input
                            id={key}
                            type="number"
                            min={key === 'caloriesKcal' ? '1' : '0'}
                            max="10000"
                            required
                            value={goalForm[key]}
                            onChange={(event) => setGoalForm((previous) => ({ ...previous, [key]: event.target.value }))}
                            className="w-full rounded-xl border border-[#E5E1EC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                          />
                        </div>
                      ))}
                      <button disabled={savingGoals} type="submit" className="w-full rounded-xl bg-[#151517] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                        {savingGoals ? 'Saving goals...' : 'Save goals'}
                      </button>
                    </form>
                  )}

                  <div className="mt-7 space-y-6">
                    {progressRows.map((item) => <ProgressRow key={item.label} {...item} />)}
                  </div>

                  <p className="mt-6 rounded-2xl bg-[#FBF7EF] p-4 text-sm leading-6 text-[#84735D]">
                    Nutrition goals are tracking targets you configure, not personalized medical or dietary advice.
                  </p>
                </div>
              </div>
            </section>

            <section id="meal-logger" className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
                <p className="text-sm font-medium text-[#8B7A9D]">KEEP A RECORD</p>
                <h2 className="mt-1 text-xl font-bold">Log your meal</h2>
                <p className="mt-2 text-sm text-[#7E7E82]">Search a food to fill its nutrition values, or enter them manually.</p>

                <form onSubmit={addMeal} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="meal-name" className="mb-2 block text-sm font-medium">Food name</label>
                    <input id="meal-name" required maxLength={100} value={mealName} onChange={(event) => { setMealName(event.target.value); setFoodNutritionPer100g(null) }} placeholder="e.g. Paneer and roti" className="w-full rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]" />
                  </div>

                  <div className="rounded-2xl border border-[#EAE3F2] bg-[#FBF9FD] p-4">
                    <label htmlFor="food-search" className="mb-2 block text-sm font-semibold">Find food nutrition</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="food-search"
                        value={foodSearch}
                        onChange={(event) => setFoodSearch(event.target.value)}
                        minLength={2}
                        maxLength={100}
                        placeholder="Search foods, e.g. banana or rice"
                        className="min-w-0 flex-1 rounded-xl border border-[#E5E1EC] bg-white px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                      />
                      <button type="button" onClick={handleFoodSearch} disabled={searchingFoods || foodSearch.trim().length < 2} className="rounded-xl bg-[#7652A6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#60428A] disabled:cursor-not-allowed disabled:opacity-60">
                        {searchingFoods ? 'Searching...' : 'Search foods'}
                      </button>
                    </div>
                    {foodResults.length > 0 && (
                      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                        {foodResults.map((food, index) => {
                          const id = food?.fdcId ?? food?.fdc_id ?? food?.id ?? `food-${index}`
                          const name = food?.description || food?.name || food?.foodName || food?.title || 'Food result'
                          const detail = food?.dataType || food?.data_type || food?.brandOwner || food?.brandName || ''
                          return (
                            <button key={id} type="button" disabled={loadingFoodNutrition} onClick={() => handleSelectFood(food)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#EAE3F2] bg-white p-3 text-left transition hover:border-[#B58BDC] hover:bg-[#F8F5FC] disabled:opacity-60">
                              <span className="min-w-0">
                                <span className="block break-words text-sm font-semibold">{name}</span>
                                {detail && <span className="mt-1 block text-xs text-[#7E7E82]">{detail}</span>}
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-[#7652A6]">{loadingFoodNutrition && selectedFoodId === String(id) ? 'Loading...' : 'Use food'}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <p className="mt-2 text-xs leading-5 text-[#7E7E82]">Choose a result to fill the meal form with nutrition values per 100 g when the food service provides them. Check values and serving size before saving.</p>
                  </div>

                  <div>
                    <label htmlFor="meal-type" className="mb-2 block text-sm font-medium">Meal type</label>
                    <select id="meal-type" value={mealType} onChange={(event) => setMealType(event.target.value)} className="w-full rounded-xl border border-[#E5E1EC] bg-white px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]">
                      {mealOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="serving-size" className="mb-2 block text-sm font-medium">Serving size</label>
                      <input id="serving-size" type="number" min="0.01" step="any" required value={servingSize} onChange={(event) => setServingSize(event.target.value)} className="w-full rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]" />
                    </div>
                    <div>
                      <label htmlFor="serving-unit" className="mb-2 block text-sm font-medium">Serving unit</label>
                      <select id="serving-unit" value={servingUnit} onChange={(event) => setServingUnit(event.target.value)} className="w-full rounded-xl border border-[#E5E1EC] bg-white px-3 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]">
                        {['g', 'ml', 'piece', 'cup', 'serving'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      [ 'meal-calories', foodNutritionPer100g ? 'Calories (per 100 g)' : 'Calories (kcal)', calories, setCalories, 10000],
                      ['meal-protein', foodNutritionPer100g ? 'Protein (per 100 g)' : 'Protein (g)', protein, setProtein, 2000],
                      ['meal-carbs', foodNutritionPer100g ? 'Carbs (per 100 g)' : 'Carbohydrates (g)', carbohydrates, setCarbohydrates, 2000],
                      ['meal-fat', foodNutritionPer100g ? 'Fat (per 100 g)' : 'Fat (g)', fat, setFat, 2000],
                    ].map(([id, label, value, setter, max]) => (
                      <div key={id}>
                        <label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>
                        <input id={id} type="number" min="0" max={max} step="any" required value={value} onChange={(event) => { setter(event.target.value); setFoodNutritionPer100g(null) }} placeholder="0" className="w-full rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]" />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label htmlFor="meal-notes" className="mb-2 block text-sm font-medium">Notes (optional)</label>
                    <textarea id="meal-notes" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything you want to remember..." rows={2} className="w-full resize-y rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]" />
                  </div>

                  <button disabled={savingMeal} type="submit" className="w-full rounded-xl bg-[#151517] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#35323A] disabled:cursor-not-allowed disabled:opacity-60">
                    {savingMeal ? 'Saving meal...' : 'Save meal'}
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#8B7A9D]">TODAY'S FOOD</p>
                    <h2 className="mt-1 text-xl font-bold">Meal diary</h2>
                  </div>
                  <span className="rounded-full bg-[#F3EDF9] px-3 py-1.5 text-xs font-semibold text-[#745496]">
                    {nutrition.entryCount ?? entries.length} logged
                  </span>
                </div>

                {entries.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-[#DDD2EA] bg-[#FCFAFE] px-5 py-10 text-center">
                    <span className="text-4xl">🥗</span>
                    <p className="mt-3 font-semibold">Your meal diary is empty</p>
                    <p className="mt-1 text-sm text-[#7E7E82]">Save your first meal to see your daily totals.</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {entries.map((meal, index) => (
                      <div key={meal._id || meal.id || `${meal.foodName}-${index}`} className="flex items-start gap-3 rounded-2xl border border-[#F0EBF5] p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3EDF9] text-xl">
                          {meal.mealType === 'breakfast' ? '🥣' : meal.mealType === 'lunch' ? '🍱' : meal.mealType === 'dinner' ? '🍲' : '🍎'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold">{meal.foodName || meal.name}</p>
                          <p className="mt-1 text-xs capitalize text-[#7E7E82]">{meal.mealType} · {meal.servingSize} {meal.servingUnit}</p>
                          <p className="mt-1 text-xs text-[#7E7E82]">
                            Protein {Number(meal.protein || 0)} g · Carbs {Number(meal.carbohydrates || 0)} g · Fat {Number(meal.fat || 0)} g
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold">{Number(meal.calories || 0)} kcal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Calories', totalCalories, 'kcal', 'bg-[#F3EDF9]'],
                    ['Protein', totalProtein, 'g', 'bg-[#E7F5EB]'],
                    ['Carbs', totalCarbohydrates, 'g', 'bg-[#FFF0DF]'],
                    ['Fat', totalFat, 'g', 'bg-[#FCE4F5]'],
                  ].map(([label, value, unit, color]) => (
                    <div key={label} className={`rounded-2xl p-4 ${color}`}>
                      <p className="text-xs text-[#7E7E82]">{label}</p>
                      <p className="mt-1 text-lg font-bold">{Number(value).toFixed(1)} <span className="text-xs font-medium">{unit}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div>
                <p className="text-sm font-medium text-[#8B7A9D]">SIMPLE MEAL IDEAS</p>
                <h2 className="mt-1 text-2xl font-bold">Quick add</h2>
                <p className="mt-2 text-sm text-[#7E7E82]">Example nutrition estimates. Review serving sizes before logging.</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {mealSuggestions.map((meal, index) => (
                  <div key={meal.name} className="group rounded-2xl border border-[#EAE3F2] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${index % 3 === 0 ? 'bg-[#FDE8D5]' : index % 3 === 1 ? 'bg-[#E4DBF4]' : 'bg-[#DDF3E6]'}`}>
                        {index % 3 === 0 ? '🥣' : index % 3 === 1 ? '🥑' : '🥗'}
                      </span>
                      <span className="rounded-full bg-[#F8F5FC] px-3 py-1 text-xs font-medium text-[#7E7E82]">{meal.type}</span>
                    </div>
                    <h3 className="mt-4 font-semibold">{meal.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#7E7E82]">
                      <span>{meal.calories} kcal</span>
                      <span>{meal.protein} g protein</span>
                    </div>
                    <button disabled={savingMeal} type="button" onClick={() => addSuggestion(meal)} className="mt-5 w-full rounded-xl border border-[#E4DBF4] bg-[#F8F5FC] px-4 py-3 text-sm font-semibold text-[#745496] transition hover:bg-[#EDE4F8] disabled:opacity-60">
                      {savingMeal ? 'Please wait...' : '+ Add to diary'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <p className="pb-4 text-center text-xs leading-5 text-[#8A8490]">
          FitNect records the nutrition and fluid values you enter. Meal suggestions are estimates, and configured goals are tracking targets rather than personalized medical advice.
        </p>
      </div>
    </div>
  )
}
