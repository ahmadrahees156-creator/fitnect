import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fitnect_steps'
const GOAL_KEY = 'fitnect_steps_goal'
const DEFAULT_GOAL = 8000

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function readData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function readGoal() {
  try {
    const value = Number(localStorage.getItem(GOAL_KEY))
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_GOAL
  } catch {
    return DEFAULT_GOAL
  }
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function Footsteps() {
  const [today, setToday] = useState(getToday)
  const [records, setRecords] = useState(readData)
  const [goal, setGoal] = useState(readGoal)
  const [manualInput, setManualInput] = useState('')
  const [goalInput, setGoalInput] = useState(String(readGoal()))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const steps = Number(records[today]?.steps || 0)
  const progress = Math.min((steps / goal) * 100, 100)
  const remaining = Math.max(goal - steps, 0)
  const history = Object.entries(records)
    .filter(([date, entry]) => date !== today && Number(entry?.steps) >= 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)

  useEffect(() => {
    const updateDate = () => {
      const currentDate = getToday()
      if (currentDate !== today) {
        setToday(currentDate)
        setRecords(readData())
      }
    }

    window.addEventListener('focus', updateDate)
    return () => window.removeEventListener('focus', updateDate)
  }, [today])

  function saveSteps(nextSteps) {
    const safeSteps = Math.max(0, Math.floor(nextSteps))
    const updated = {
      ...records,
      [today]: {
        steps: safeSteps,
        updatedAt: new Date().toISOString(),
      },
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setRecords(updated)
      setMessage('Your step count has been saved.')
      setError('')
    } catch {
      setError('Could not save steps. Check your browser storage.')
      setMessage('')
    }
  }

  function addManualSteps(event) {
    event.preventDefault()
    const amount = Number(manualInput)

    if (
      manualInput.trim() === '' ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 100000
    ) {
      setError('Enter a whole number between 1 and 100,000.')
      setMessage('')
      return
    }

    saveSteps(steps + amount)
    setManualInput('')
  }

  function saveGoal(event) {
    event.preventDefault()
    const value = Number(goalInput)

    if (!Number.isSafeInteger(value) || value < 500 || value > 100000) {
      setError('Choose a daily goal between 500 and 100,000 steps.')
      setMessage('')
      return
    }

    try {
      localStorage.setItem(GOAL_KEY, String(value))
      setGoal(value)
      setMessage('Your daily step goal has been updated.')
      setError('')
    } catch {
      setError('Could not save your goal.')
      setMessage('')
    }
  }

  return (
    <div className="fitnect-enter space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#E9E0F2] bg-[#E4DBF4] p-6 sm:p-9 lg:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#F373D4]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-[#FDC381]/35 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#806991]">
              Daily movement
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#151517] sm:text-4xl">
              Every step counts.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#68616F] sm:text-base">
              Keep a simple record of your daily walking, build consistency, and
              work towards an activity goal that suits you.
            </p>

            <div className="mt-7 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-4xl font-bold tabular-nums text-[#151517] sm:text-5xl">
                {steps.toLocaleString('en-IN')}
              </span>
              <span className="pb-1 text-sm font-medium text-[#68616F]">steps today</span>
            </div>
            <p className="mt-2 text-sm text-[#68616F]">
              {remaining === 0
                ? 'Daily goal reached. Great consistency!'
                : `${remaining.toLocaleString('en-IN')} steps left to reach your goal`}
            </p>

            <div className="mt-5 h-2.5 max-w-md overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-[#151517] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex max-w-md items-center justify-between text-xs font-medium text-[#68616F]">
              <span>{Math.round(progress)}% completed</span>
              <span>Goal: {goal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="mx-auto flex h-40 w-40 flex-col items-center justify-center rounded-full border-[10px] border-white/70 bg-white/60 shadow-sm sm:h-48 sm:w-48">
            <span className="text-4xl" aria-hidden="true">👟</span>
            <span className="mt-2 text-3xl font-bold text-[#302442]">{Math.round(progress)}%</span>
            <span className="mt-1 text-xs font-medium text-[#806991]">daily goal</span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-[#EEEAF3] bg-white p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FCEBD7] text-xl" aria-hidden="true">
              <span>👣</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#151517]">Log your steps</h3>
              <p className="mt-1 text-sm leading-5 text-[#7E7E82]">
                Add steps from your phone, watch, or any pedometer.
              </p>
            </div>
          </div>

          <form onSubmit={addManualSteps} className="mt-6">
            <label htmlFor="manual-steps" className="text-sm font-semibold text-[#302442]">
              Steps to add
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="manual-steps"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={manualInput}
                onChange={(event) => setManualInput(event.target.value)}
                placeholder="e.g. 1500"
                className="min-w-0 flex-1 rounded-xl border border-[#E5DCEC] bg-[#FCFAFE] px-4 py-3 text-sm outline-none transition placeholder:text-[#AAA0B4] focus:border-[#A98BC5] focus:ring-2 focus:ring-[#E4DBF4]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#151517] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#34343A] focus:outline-none focus:ring-2 focus:ring-[#A98BC5] focus:ring-offset-2"
              >
                Add steps
              </button>
            </div>
          </form>

          <form onSubmit={saveGoal} className="mt-6 border-t border-[#F0EAF4] pt-5">
            <label htmlFor="step-goal" className="text-sm font-semibold text-[#302442]">
              Daily step goal
            </label>
            <p className="mt-1 text-xs leading-5 text-[#7E7E82]">
              Set a realistic target and adjust it whenever you need.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="step-goal"
                type="number"
                min="500"
                max="100000"
                step="500"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-[#E5DCEC] bg-[#FCFAFE] px-4 py-3 text-sm outline-none transition focus:border-[#A98BC5] focus:ring-2 focus:ring-[#E4DBF4]"
              />
              <button
                type="submit"
                className="rounded-xl border border-[#E5DCEC] bg-[#F8F5FC] px-5 py-3 text-sm font-semibold text-[#493456] transition hover:bg-[#EDE5F6]"
              >
                Save goal
              </button>
            </div>
          </form>
        </article>

        <article className="flex flex-col rounded-3xl border border-[#EEEAF3] bg-white p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7A9D]">
            Your daily target
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#151517]">Small steps, steady progress</h3>
          <p className="mt-2 text-sm leading-6 text-[#7E7E82]">
            Consistent movement matters more than hitting a perfect number every day.
            Use your step log to notice patterns and build a routine that works for you.
          </p>

          <div className="mt-6 rounded-2xl bg-[#F8F5FC] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#68616F]">Today's progress</span>
              <span className="text-sm font-bold text-[#493456]">{Math.round(progress)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E0F0]">
              <div
                className="h-full rounded-full bg-[#CAECD6] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#7E7E82]">
              <span>{steps.toLocaleString('en-IN')} steps</span>
              <span>{goal.toLocaleString('en-IN')} goal</span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#F1E4D2] bg-[#FFFAF2] p-4">
            <span className="mt-0.5 text-lg" aria-hidden="true">💡</span>
            <p className="text-sm leading-6 text-[#78654D]">
              Tip: enter the total from your step counter for today. Each entry is
              added to your existing daily count.
            </p>
          </div>
        </article>
      </section>

      {(message || error) && (
        <p
          role={error ? 'alert' : 'status'}
          className={`rounded-2xl border px-4 py-3 text-sm leading-5 ${
            error
              ? 'border-[#F3CACA] bg-[#FFF3F3] text-[#9B4545]'
              : 'border-[#D2EBDD] bg-[#F0F9F3] text-[#397A52]'
          }`}
        >
          {error || message}
        </p>
      )}

      <section className="rounded-3xl border border-[#EEEAF3] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7A9D]">
              Activity log
            </p>
            <h3 className="mt-2 text-xl font-bold text-[#151517]">Recent step history</h3>
            <p className="mt-1 text-sm text-[#7E7E82]">Your previous 7 recorded days</p>
          </div>
          <span className="rounded-full bg-[#E4DBF4] px-3 py-1.5 text-xs font-semibold text-[#5C4675]">
            Daily goal: {goal.toLocaleString('en-IN')}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#E5DCEC] bg-[#FCFAFE] px-5 py-8 text-center">
            <p className="font-semibold text-[#302442]">No previous records yet</p>
            <p className="mt-2 text-sm leading-6 text-[#7E7E82]">
              Your daily step history will appear here after you log steps on different days.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {history.map(([date, entry]) => {
              const percentage = Math.min((Number(entry.steps) / goal) * 100, 100)

              return (
                <div key={date}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#302442]">{formatDate(date)}</span>
                    <span className="text-sm font-bold tabular-nums text-[#493456]">
                      {Number(entry.steps).toLocaleString('en-IN')} <span className="font-medium text-[#7E7E82]">steps</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#F0EAF4]">
                    <div
                      className="h-full rounded-full bg-[#CAECD6] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs text-[#8B8A90]">
                    {Math.round(percentage)}% of goal
                  </p>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-5 border-t border-[#EEEAF3] pt-4 text-xs leading-5 text-[#8B8A90]">
          Step records are stored in this browser only. They are not currently synced to your FitNect account.
        </p>
      </section>
    </div>
  )
}

export default Footsteps
