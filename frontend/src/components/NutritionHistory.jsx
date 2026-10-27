import { useEffect, useState } from 'react'
import { getNutritionHistory } from '../services/nutritionService'

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || 'Nutrition history is temporarily unavailable.'
}

export default function NutritionHistory({ refreshTrigger }) {
  const [days, setDays] = useState(7)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadHistory() {
      setLoading(true)
      setError('')
      try {
        const response = await getNutritionHistory(days)
        if (active) setHistory(Array.isArray(response?.history) ? response.history : [])
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHistory()
    return () => { active = false }
  }, [days, refreshTrigger])

  const maxCalories = Math.max(1, ...history.map((day) => Number(day.calories) || 0))

  return (
    <section className="rounded-3xl border border-[#EAE3F2] bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#8B7A9D]">YOUR NUTRITION JOURNEY</p>
          <h2 className="mt-1 text-xl font-bold text-[#151517]">Nutrition history</h2>
          <p className="mt-2 text-sm text-[#7E7E82]">Daily calories and macros from your saved food diary.</p>
        </div>
        <select
          aria-label="Nutrition history period"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-xl border border-[#E5E1EC] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#A88BCB] focus:ring-2 focus:ring-[#E4DBF4]"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-5 h-32 animate-pulse rounded-2xl bg-[#F8F5FC]" />
      ) : error ? (
        <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : history.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#FBF9FD] p-5 text-sm text-[#7E7E82]">No nutrition history is available yet.</p>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {history.map((day) => {
              const calories = Number(day.calories) || 0
              const dateLabel = new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                weekday: 'short',
                timeZone: 'UTC',
              })
              return (
                <div key={day.date} className="grid grid-cols-[76px_minmax(0,1fr)_74px] items-center gap-3 sm:grid-cols-[100px_minmax(0,1fr)_90px]">
                  <span className="text-xs font-medium text-[#7E7E82]">{dateLabel}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-[#F2EAF8]">
                    <div className="h-full rounded-full bg-[#B58BDC] transition-all duration-500" style={{ width: `${Math.min((calories / maxCalories) * 100, 100)}%` }} />
                  </div>
                  <span className="text-right text-xs font-semibold text-[#151517]">{Math.round(calories).toLocaleString()} kcal</span>
                </div>
              )
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Protein', history.reduce((sum, day) => sum + (Number(day.protein) || 0), 0), 'g', 'bg-[#E7F5EB]'],
              ['Carbs', history.reduce((sum, day) => sum + (Number(day.carbohydrates) || 0), 0), 'g', 'bg-[#FFF0DF]'],
              ['Fat', history.reduce((sum, day) => sum + (Number(day.fat) || 0), 0), 'g', 'bg-[#FCE4F5]'],
              ['Food entries', history.reduce((sum, day) => sum + (Number(day.entryCount) || 0), 0), '', 'bg-[#F3EDF9]'],
            ].map(([label, value, unit, color]) => (
              <div key={label} className={`rounded-2xl p-4 ${color}`}>
                <p className="text-xs text-[#7E7E82]">{label}</p>
                <p className="mt-1 text-lg font-bold text-[#151517]">{Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit}</p>
                <p className="mt-1 text-xs text-[#7E7E82]">Across {days} days</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
