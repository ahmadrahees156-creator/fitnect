
import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'fitnect_nutrition'
const WATER_GOAL = 2500

const mealOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const initialData = {
  water: 0,
  meals: [],
}

const mealSuggestions = [
  { name: 'Oats with milk', calories: 280, protein: 12, type: 'Breakfast' },
  { name: 'Eggs and whole wheat toast', calories: 320, protein: 20, type: 'Breakfast' },
  { name: 'Rice, dal and vegetables', calories: 450, protein: 16, type: 'Lunch' },
  { name: 'Paneer with roti', calories: 420, protein: 24, type: 'Dinner' },
  { name: 'Banana and almonds', calories: 190, protein: 5, type: 'Snack' },
  { name: 'Greek yogurt', calories: 130, protein: 12, type: 'Snack' },
]

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readNutrition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveNutrition(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
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

export default function Nutrition() {
  const [today, setToday] = useState(getToday)
  const [dailyData, setDailyData] = useState(() => {
    const allData = readNutrition()
    return allData[getToday()] || initialData
  })
  const [allData, setAllData] = useState(readNutrition)
  const [waterAmount, setWaterAmount] = useState('250')
  const [mealType, setMealType] = useState('Breakfast')
  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const currentDate = getToday()
    if (currentDate !== today) {
      setToday(currentDate)
      const stored = readNutrition()
      setAllData(stored)
      setDailyData(stored[currentDate] || initialData)
    }
  }, [today])

  const totalCalories = useMemo(
    () => dailyData.meals.reduce((total, meal) => total + Number(meal.calories || 0), 0),
    [dailyData.meals]
  )

  const totalProtein = useMemo(
    () => dailyData.meals.reduce((total, meal) => total + Number(meal.protein || 0), 0),
    [dailyData.meals]
  )

  const waterProgress = Math.min((dailyData.water / WATER_GOAL) * 100, 100)
  const calorieGoal = 2000
  const proteinGoal = 100

  function updateToday(nextData) {
    const updatedAllData = {
      ...allData,
      [today]: nextData,
    }

    const saved = saveNutrition(updatedAllData)

    setAllData(updatedAllData)
    setDailyData(nextData)
    setMessage(saved ? 'Your nutrition log has been saved.' : 'Unable to save. Check your browser storage settings.')
  }

  function addWater(amount) {
    const nextAmount = Math.max(0, dailyData.water + amount)
    updateToday({
      ...dailyData,
      water: nextAmount,
    })
  }

  function addMeal(event) {
    event.preventDefault()

    if (!mealName.trim() || calories === '' || protein === '') {
      setMessage('Please enter the meal name, calories and protein.')
      return
    }

    if (
      !Number.isFinite(Number(calories)) ||
      !Number.isFinite(Number(protein)) ||
      Number(calories) < 0 ||
      Number(protein) < 0 ||
      Number(calories) > 10000 ||
      Number(protein) > 1000
    ) {
      setMessage('Enter valid nutrition values.')
      return
    }

    const meal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: mealName.trim(),
      type: mealType,
      calories: Number(calories),
      protein: Number(protein),
    }

    updateToday({
      ...dailyData,
      meals: [...dailyData.meals, meal],
    })

    setMealName('')
    setCalories('')
    setProtein('')
  }

  function removeMeal(mealId) {
    updateToday({
      ...dailyData,
      meals: dailyData.meals.filter((meal) => meal.id !== mealId),
    })
  }

  function addSuggestion(meal) {
    const newMeal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
    }

    updateToday({
      ...dailyData,
      meals: [...dailyData.meals, newMeal],
    })
  }

  const progressBar = (value, goal) => `${Math.min((value / goal) * 100, 100)}%`

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
                Build simple nutrition habits, track your hydration and keep your daily goals in sight.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#meal-logger"
                  className="rounded-xl bg-[#151517] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#35323A]"
                >
                  + Log a meal
                </a>
                <a
                  href="#hydration"
                  className="rounded-xl border border-white/80 bg-white/70 px-5 py-3 text-sm font-semibold text-[#51465E] transition hover:bg-white"
                >
                  Track water
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xs">
              <div className="relative rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-lg shadow-[#927BB3]/10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#7E7E82]">Today's nutrition</p>
                    <p className="mt-1 text-2xl font-bold">{totalCalories.toLocaleString()} kcal</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDC381]/60 text-2xl">
                    🍊
                  </span>
                </div>

                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#EDE7F5]">
                  <div
                    className="h-full rounded-full bg-[#B58BDC] transition-all duration-500"
                    style={{ width: progressBar(totalCalories, calorieGoal) }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs text-[#7E7E82]">
                  <span>Daily calorie target</span>
                  <span>{calorieGoal.toLocaleString()} kcal</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F3EDF9] p-3">
                    <p className="text-xs text-[#7E7E82]">Protein</p>
                    <p className="mt-1 text-lg font-bold">{totalProtein} g</p>
                  </div>
                  <div className="rounded-2xl bg-[#E7F5EB] p-3">
                    <p className="text-xs text-[#668071]">Water</p>
                    <p className="mt-1 text-lg font-bold">{dailyData.water} ml</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Calories consumed"
            value={totalCalories.toLocaleString()}
            unit="kcal"
            detail={`${Math.max(calorieGoal - totalCalories, 0).toLocaleString()} kcal until demo target`}
            icon="🔥"
            color="bg-[#FDE8D5]"
          />
          <StatCard
            label="Protein intake"
            value={totalProtein}
            unit="g"
            detail={`${Math.max(proteinGoal - totalProtein, 0)} g until demo target`}
            icon="🥚"
            color="bg-[#E4DBF4]"
          />
          <StatCard
            label="Water consumed"
            value={(dailyData.water / 1000).toFixed(2)}
            unit="L"
            detail={`${Math.max(WATER_GOAL - dailyData.water, 0)} ml to reach water goal`}
            icon="💧"
            color="bg-[#DCEFE5]"
          />
          <StatCard
            label="Meals logged"
            value={dailyData.meals.length}
            unit="meals"
            detail="Meals recorded today"
            icon="🥗"
            color="bg-[#FCE4F5]"
          />
        </section>

        <section id="hydration" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#8B7A9D]">STAY HYDRATED</p>
                <h2 className="mt-1 text-xl font-bold">Water tracker</h2>
                <p className="mt-2 text-sm text-[#7E7E82]">Small sips, steady progress.</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4EEFF] text-2xl">
                💧
              </span>
            </div>

            <div className="mt-7 flex items-end justify-between gap-4">
              <div>
                <span className="text-4xl font-bold tracking-tight">{(dailyData.water / 1000).toFixed(2)}</span>
                <span className="ml-2 text-sm text-[#7E7E82]">litres</span>
              </div>
              <p className="text-sm font-medium text-[#7E7E82]">{WATER_GOAL / 1000} L goal</p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EEF0F8]">
              <div
                className="h-full rounded-full bg-[#A9CDFA] transition-all duration-500"
                style={{ width: `${waterProgress}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-[#7E7E82]">
              <span>{Math.round(waterProgress)}% completed</span>
              <span>{Math.max(WATER_GOAL - dailyData.water, 0)} ml left</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[150, 250, 500].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => addWater(amount)}
                  className="rounded-xl border border-[#E5E1EC] bg-[#FBF9FD] px-3 py-3 text-sm font-semibold transition hover:border-[#B99BDE] hover:bg-[#F2EAFB] active:scale-95"
                >
                  + {amount} ml
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <input
                type="number"
                min="1"
                max="5000"
                value={waterAmount}
                onChange={(event) => setWaterAmount(event.target.value)}
                aria-label="Custom water amount in millilitres"
                placeholder="Amount in ml"
                className="min-w-0 flex-1 rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none transition focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
              />
              <button
                type="button"
                onClick={() => {
                  const amount = Number(waterAmount)
                  if (Number.isFinite(amount) && amount > 0 && amount <= 5000) {
                    addWater(amount)
                    setWaterAmount('250')
                  } else {
                    setMessage('Enter a water amount between 1 and 5000 ml.')
                  }
                }}
                className="rounded-xl bg-[#E4DBF4] px-5 py-3 text-sm font-semibold text-[#5C4381] transition hover:bg-[#D9CAEF]"
              >
                Add water
              </button>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#8A8490]">
              The 2.5 L target is a demo setting, not a universal hydration recommendation. Individual needs vary.
            </p>
          </div>

          <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-medium text-[#8B7A9D]">DAILY TARGETS</p>
            <h2 className="mt-1 text-xl font-bold">Nutrition overview</h2>
            <p className="mt-2 text-sm text-[#7E7E82]">Compare your logged intake with example targets.</p>

            <div className="mt-7 space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Calories</span>
                  <span className="text-[#7E7E82]">{totalCalories} / {calorieGoal} kcal</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#F2EAF8]">
                  <div
                    className="h-full rounded-full bg-[#B58BDC] transition-all duration-500"
                    style={{ width: progressBar(totalCalories, calorieGoal) }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Protein</span>
                  <span className="text-[#7E7E82]">{totalProtein} / {proteinGoal} g</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#E7F5EB]">
                  <div
                    className="h-full rounded-full bg-[#94D4AE] transition-all duration-500"
                    style={{ width: progressBar(totalProtein, proteinGoal) }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Hydration</span>
                  <span className="text-[#7E7E82]">{Math.round(dailyData.water / WATER_GOAL * 100)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EEFF]">
                  <div
                    className="h-full rounded-full bg-[#A9CDFA] transition-all duration-500"
                    style={{ width: `${waterProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-[#FBF7EF] p-4">
              <p className="text-sm font-semibold text-[#765A34]">A gentle reminder</p>
              <p className="mt-1 text-sm leading-6 text-[#84735D]">
                These example targets are not a personalized diet prescription. Your needs depend on factors such as activity, body size and health.
              </p>
            </div>
          </div>
        </section>

        <section id="meal-logger" className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-medium text-[#8B7A9D]">KEEP A RECORD</p>
            <h2 className="mt-1 text-xl font-bold">Log your meal</h2>
            <p className="mt-2 text-sm text-[#7E7E82]">Add a meal and its nutrition details for today.</p>

            <form onSubmit={addMeal} className="mt-6 space-y-4">
              <div>
                <label htmlFor="meal-name" className="mb-2 block text-sm font-medium">Meal name</label>
                <input
                  id="meal-name"
                  value={mealName}
                  onChange={(event) => setMealName(event.target.value)}
                  maxLength={100}
                  placeholder="e.g. Paneer and roti"
                  className="w-full rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                />
              </div>

              <div>
                <label htmlFor="meal-type" className="mb-2 block text-sm font-medium">Meal type</label>
                <select
                  id="meal-type"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value)}
                  className="w-full rounded-xl border border-[#E5E1EC] bg-white px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                >
                  {mealOptions.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="meal-calories" className="mb-2 block text-sm font-medium">Calories (kcal)</label>
                  <input
                    id="meal-calories"
                    type="number"
                    min="0"
                    max="10000"
                    value={calories}
                    onChange={(event) => setCalories(event.target.value)}
                    placeholder="e.g. 350"
                    className="w-full rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                  />
                </div>
                <div>
                  <label htmlFor="meal-protein" className="mb-2 block text-sm font-medium">Protein (g)</label>
                  <input
                    id="meal-protein"
                    type="number"
                    min="0"
                    max="1000"
                    value={protein}
                    onChange={(event) => setProtein(event.target.value)}
                    placeholder="e.g. 20"
                    className="w-full rounded-xl border border-[#E5E1EC] px-4 py-3 text-sm outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#151517] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#35323A] active:scale-[0.99]"
              >
                Save meal
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
                {dailyData.meals.length} logged
              </span>
            </div>

            {dailyData.meals.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#DDD2EA] bg-[#FCFAFE] px-5 py-10 text-center">
                <span className="text-4xl">🥑</span>
                <p className="mt-3 font-semibold">Your meal diary is empty</p>
                <p className="mt-1 text-sm text-[#7E7E82]">Log your first meal to see your daily totals.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {dailyData.meals.map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 rounded-2xl border border-[#F0EBF5] p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3EDF9] text-xl">
                      {meal.type === 'Breakfast' ? '🍳' : meal.type === 'Lunch' ? '🥗' : meal.type === 'Dinner' ? '🍲' : '🍎'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{meal.name}</p>
                      <p className="mt-1 text-xs text-[#7E7E82]">{meal.type} · {meal.protein} g protein</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{meal.calories} kcal</p>
                      <button
                        type="button"
                        onClick={() => removeMeal(meal.id)}
                        className="mt-1 text-xs font-medium text-[#A14F65] hover:underline"
                        aria-label={`Remove ${meal.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F3EDF9] p-4">
                <p className="text-xs text-[#7E7E82]">Total calories</p>
                <p className="mt-1 text-xl font-bold">{totalCalories} kcal</p>
              </div>
              <div className="rounded-2xl bg-[#E7F5EB] p-4">
                <p className="text-xs text-[#668071]">Total protein</p>
                <p className="mt-1 text-xl font-bold">{totalProtein} g</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#8B7A9D]">SIMPLE MEAL IDEAS</p>
              <h2 className="mt-1 text-2xl font-bold">Quick add</h2>
              <p className="mt-2 text-sm text-[#7E7E82]">Use example meals to test your food diary.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mealSuggestions.map((meal, index) => (
              <div
                key={meal.name}
                className="group rounded-2xl border border-[#EAE3F2] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                    index % 3 === 0 ? 'bg-[#FDE8D5]' : index % 3 === 1 ? 'bg-[#E4DBF4]' : 'bg-[#DDF3E6]'
                  }`}>
                    {index % 3 === 0 ? '🥣' : index % 3 === 1 ? '🥑' : '🍽️'}
                  </span>
                  <span className="rounded-full bg-[#F8F5FC] px-3 py-1 text-xs font-medium text-[#7E7E82]">
                    {meal.type}
                  </span>
                </div>

                <h3 className="mt-4 font-semibold">{meal.name}</h3>
                <div className="mt-3 flex gap-4 text-sm text-[#7E7E82]">
                  <span>{meal.calories} kcal</span>
                  <span>{meal.protein} g protein</span>
                </div>

                <button
                  type="button"
                  onClick={() => addSuggestion(meal)}
                  className="mt-5 w-full rounded-xl border border-[#E4DBF4] bg-[#F8F5FC] px-4 py-3 text-sm font-semibold text-[#745496] transition hover:bg-[#EDE4F8] active:scale-[0.99]"
                >
                  + Add to diary
                </button>
              </div>
            ))}
          </div>
        </section>

        {message && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#E4DBF4] bg-white px-5 py-4 text-sm text-[#60428A] shadow-sm"
          >
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} className="shrink-0 font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <p className="pb-4 text-center text-xs leading-5 text-[#8A8490]">
          FitNect nutrition tracking is currently a local demo. Meal nutrition values are estimates, and the example targets are not individualized medical advice.
        </p>
      </div>
    </div>
  )
}
