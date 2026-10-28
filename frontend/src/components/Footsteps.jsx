
import { useEffect, useRef, useState } from 'react'

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

function Footsteps() {
  const [today, setToday] = useState(getToday)
  const [records, setRecords] = useState(readData)
  const [goal, setGoal] = useState(readGoal)
  const [manualInput, setManualInput] = useState('')
  const [goalInput, setGoalInput] = useState(String(readGoal()))
  const [sensorStatus, setSensorStatus] = useState('Not started')
  const [sensorActive, setSensorActive] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const lastPeak = useRef(0)
  const previousMagnitude = useRef(0)
  const lastStepTime = useRef(0)
  const sensorSteps = useRef(0)

  const steps = Number(records[today]?.steps || 0)
  const progress = Math.min((steps / goal) * 100, 100)
  const remaining = Math.max(goal - steps, 0)

  const history = Object.entries(records)
    .filter(([date, entry]) => date !== today && Number(entry.steps) >= 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)

  useEffect(() => {
    const updateDate = () => {
      const currentDate = getToday()
      if (currentDate !== today) {
        setToday(currentDate)
        setRecords(readData())
      }
    }

    const handleFocus = () => updateDate()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
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

  function handleMotion(event) {
    const acceleration = event.accelerationIncludingGravity

    if (
      !acceleration ||
      acceleration.x == null ||
      acceleration.y == null ||
      acceleration.z == null
    ) {
      return
    }

    const magnitude = Math.sqrt(
      acceleration.x ** 2 +
      acceleration.y ** 2 +
      acceleration.z ** 2
    )

    const now = Date.now()
    const change = Math.abs(magnitude - previousMagnitude.current)
    previousMagnitude.current = magnitude

    if (
      change > 1.25 &&
      magnitude > 10.5 &&
      now - lastStepTime.current > 300
    ) {
      lastStepTime.current = now
      sensorSteps.current += 1

      if (sensorSteps.current % 5 === 0) {
        const updated = {
          ...records,
          [today]: {
            steps: Number(records[today]?.steps || 0) + sensorSteps.current,
            updatedAt: new Date().toISOString(),
          },
        }

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          setRecords(updated)
        } catch {
          setError('Could not save sensor steps.')
          setSensorStatus('Storage error')
          setSensorActive(false)
        }
      }
    }
  }

  async function startSensor() {
    setError('')
    setMessage('')

    if (!('DeviceMotionEvent' in window)) {
      setSensorStatus('Sensor unavailable')
      setError('This device or browser does not provide motion sensor access.')
      return
    }

    try {
      if (
        typeof window.DeviceMotionEvent.requestPermission === 'function'
      ) {
        const permission = await window.DeviceMotionEvent.requestPermission()

        if (permission !== 'granted') {
          setSensorStatus('Permission denied')
          setError('Motion permission was not granted. You can still enter steps manually.')
          return
        }
      }

      sensorSteps.current = 0
      lastStepTime.current = 0
      previousMagnitude.current = 0
      window.addEventListener('devicemotion', handleMotion)
      setSensorActive(true)
      setSensorStatus('Listening for movement')
      setMessage('Sensor started. Carry your phone while walking.')
    } catch {
      setSensorStatus('Could not start')
      setError('Could not access the motion sensor. Try manual entry instead.')
    }
  }

  function stopSensor() {
    window.removeEventListener('devicemotion', handleMotion)

    if (sensorSteps.current > 0) {
      const updated = {
        ...records,
        [today]: {
          steps: Number(records[today]?.steps || 0) + sensorSteps.current,
          updatedAt: new Date().toISOString(),
        },
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        setRecords(updated)
      } catch {
        setError('Could not save all sensor steps.')
      }
    }

    sensorSteps.current = 0
    setSensorActive(false)
    setSensorStatus('Stopped')
    setMessage('Sensor tracking stopped.')
  }

  useEffect(() => {
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [])

  return (
    <div className="fitnect-enter space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#332743] via-[#49345B] to-[#76518B] p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#F373D4]/20 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#EBC7EF]">
              Daily movement
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Every step counts.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#DED2E7]">
              Track your daily steps, build a walking habit and move towards
              your personal activity goal.
            </p>

            <p className="mt-6 text-xs text-[#DED2E7]">
              Today's progress · {today}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums sm:text-5xl">
                {steps.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-[#DED2E7]">steps</span>
            </div>
            <p className="mt-2 text-xs text-[#DED2E7]">
              {remaining === 0
                ? 'Daily goal reached. Great work!'
                : `${remaining.toLocaleString('en-IN')} steps to your goal`}
            </p>
          </div>

          <div className="flex justify-center">
            <div
              className="relative flex h-48 w-48 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#FDC381 ${progress}%, rgba(255,255,255,.15) ${progress}% 100%)`,
              }}
              role="img"
              aria-label={`${Math.round(progress)} percent of daily step goal completed`}
            >
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-[#49345B]">
                <span className="text-4xl">👟</span>
                <span className="mt-2 text-3xl font-bold">
                  {Math.round(progress)}%
                </span>
                <span className="mt-1 text-[10px] text-[#DED2E7]">
                  of daily goal
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FCEBD7] text-xl">
              👣
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#302442]">Manual entry</h3>
              <p className="text-xs text-[#92879F]">Add steps from any device</p>
            </div>
          </div>

          <form onSubmit={addManualSteps} className="mt-6">
            <label htmlFor="manual-steps" className="text-sm font-semibold text-[#493456]">
              How many steps did you take?
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="manual-steps"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={manualInput}
                onChange={(event) => setManualInput(event.target.value)}
                placeholder="e.g. 1500"
                className="min-w-0 flex-1 rounded-xl border border-[#E8DDF0] bg-[#FCFAFE] px-4 py-3 text-sm outline-none focus:border-[#B88AD5]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#332743] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4A365D]"
              >
                Add steps
              </button>
            </div>
          </form>

          <form onSubmit={saveGoal} className="mt-6 border-t border-[#F0EAF4] pt-5">
            <label htmlFor="step-goal" className="text-sm font-semibold text-[#493456]">
              Daily step goal
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="step-goal"
                type="number"
                min="500"
                max="100000"
                step="500"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-[#E8DDF0] bg-[#FCFAFE] px-4 py-3 text-sm outline-none focus:border-[#B88AD5]"
              />
              <button
                type="submit"
                className="rounded-xl border border-[#DCCAE8] bg-[#F5EDF9] px-4 py-3 text-sm font-bold text-[#6C4A81] transition hover:bg-[#EDE1F5]"
              >
                Save goal
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4F4E9] text-xl">
              📱
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#302442]">Phone sensor</h3>
              <p className="text-xs text-[#92879F]">Experimental motion-based tracking</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F7F3FA] p-4">
            <p className="text-xs text-[#92879F]">Sensor status</p>
            <p className="mt-1 text-sm font-bold text-[#493456]">
              {sensorStatus}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#92879F]">
              Keep your phone with you while walking. Browser motion readings
              can miss steps or count other movements, so this is an estimate.
            </p>
          </div>

          {!sensorActive ? (
            <button
              type="button"
              onClick={startSensor}
              className="mt-4 w-full rounded-xl bg-[#CAECD6] px-4 py-3.5 text-sm font-bold text-[#315D42] transition hover:bg-[#B5E2C5]"
            >
              Start sensor tracking
            </button>
          ) : (
            <button
              type="button"
              onClick={stopSensor}
              className="mt-4 w-full rounded-xl bg-[#FBE5E5] px-4 py-3.5 text-sm font-bold text-[#9D4242] transition hover:bg-[#F6D4D4]"
            >
              Stop and save sensor steps
            </button>
          )}

          <p className="mt-3 text-[10px] leading-5 text-[#AA9DB3]">
            Sensor access may require HTTPS and permission. This tracker is
            not a substitute for a dedicated pedometer or health device.
          </p>
        </article>
      </section>

      {(message || error) && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${
            error
              ? 'bg-[#FBEDE7] text-[#A15C48]'
              : 'bg-[#EAF6EE] text-[#4F8966]'
          }`}
        >
          {error || message}
        </p>
      )}

      <section className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
              Activity log
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#302442]">
              Recent step history
            </h3>
          </div>
          <span className="rounded-full bg-[#F5EDF9] px-3 py-1.5 text-xs font-semibold text-[#806991]">
            Goal: {goal.toLocaleString('en-IN')}
          </span>
        </div>

        {history.length === 0 ? (
          <p className="mt-5 rounded-xl bg-[#FCFAFE] p-4 text-sm text-[#92879F]">
            Your previous daily step records will appear here.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {history.map(([date, entry]) => {
              const percentage = Math.min((entry.steps / goal) * 100, 100)

              return (
                <div key={date}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#493456]">{date}</span>
                    <span className="text-sm font-bold text-[#6C4A81]">
                      {Number(entry.steps).toLocaleString('en-IN')} steps
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F0EAF4]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#B9DCC5] to-[#D8A7E8] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-5 text-[10px] leading-5 text-[#AA9DB3]">
          Data is stored in this browser only. Clearing browser storage can
          erase your history. Steps are not synced to your FitNect account.
        </p>
      </section>
    </div>
  )
}

export default Footsteps
