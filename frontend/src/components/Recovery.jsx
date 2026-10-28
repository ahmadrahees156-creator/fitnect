import { useCallback, useEffect, useState } from 'react'
import {
  getTodayRecovery,
  getRecoveryHistory,
  saveRecoveryCheckIn,
} from '../services/recoveryService'

const recoveryTips = [
  {
    title: 'Prioritize sleep',
    detail: 'Keep a consistent sleep schedule and allow enough time to rest.',
    icon: '◷',
    color: '#E8DDF7',
  },
  {
    title: 'Gentle movement',
    detail: 'Try easy walking or comfortable mobility exercises on rest days.',
    icon: '↗',
    color: '#DDF3E6',
  },
  {
    title: 'Stay hydrated',
    detail: 'Drink water regularly and adjust intake to your activity and conditions.',
    icon: '◌',
    color: '#FCE8D3',
  },
]

const defaultForm = {
  mood: 'good',
  sleepHours: '8',
  sleepQuality: 'good',
  energy: 7,
  soreness: 2,
  stress: 2,
  notes: '',
}

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeRecovery(entry) {
  return {
    mood: entry.mood ?? 'good',
    sleepHours: String(entry.sleepHours ?? 8),
    sleepQuality: entry.sleepQuality ?? 'good',
    energy: Number(entry.energy ?? 7),
    soreness: Number(entry.soreness ?? 2),
    stress: Number(entry.stress ?? 2),
    notes: entry.notes ?? '',
  }
}

function calculateScore(entry) {
  const sleep = Number(entry.sleepHours) || 0
  const energy = Number(entry.energy) || 0
  const soreness = Number(entry.soreness) || 0
  const stress = Number(entry.stress) || 0

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (Math.min(sleep, 10) / 10) * 30 +
        (energy / 10) * 30 +
        ((5 - soreness) / 5) * 20 +
        ((5 - stress) / 5) * 20
      )
    )
  )
}

function formatDate(date, today) {
  if (date === today) return 'Today'

  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function getDateKey(entry) {
  return entry.date ? String(entry.date).slice(0, 10) : ''
}

export default function Recovery() {
  const [today, setToday] = useState(getTodayUTC)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const loadRecovery = useCallback(async () => {
    setLoading(true)
    setError('')

    const currentDate = getTodayUTC()
    setToday(currentDate)

    try {
      const [todayResponse, historyResponse] = await Promise.all([
        getTodayRecovery(),
        getRecoveryHistory(30),
      ])

      const todayEntry = todayResponse?.recovery ?? null
      const historyEntries = Array.isArray(historyResponse?.recovery)
        ? historyResponse.recovery
        : []

      setForm(
        todayEntry
          ? normalizeRecovery(todayEntry)
          : { ...defaultForm }
      )
      setHistory(historyEntries)
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Your session may have expired. Please log in again.'
          : err.response?.data?.message ||
            'Could not load recovery data. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecovery()
  }, [loadRecovery])

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setSavedMessage('')
    setError('')
  }

  const handleSave = async () => {
    const sleep = Number(form.sleepHours)

    if (
      form.sleepHours === '' ||
      !Number.isFinite(sleep) ||
      sleep < 0 ||
      sleep > 24
    ) {
      setError('Enter sleep duration between 0 and 24 hours.')
      return
    }

    const payload = {
      date: today,
      mood: form.mood,
      energy: Number(form.energy),
      sleepHours: sleep,
      sleepQuality: form.sleepQuality,
      stress: Number(form.stress),
      soreness: Number(form.soreness),
      notes: form.notes.trim(),
    }

    setSaving(true)
    setError('')
    setSavedMessage('')

    try {
      const response = await saveRecoveryCheckIn(payload)

      if (!response?.success) {
        throw new Error(
          response?.message || 'The recovery check-in could not be saved.'
        )
      }

      setSavedMessage(
        response.message || 'Your recovery check-in has been saved.'
      )

      await loadRecovery()
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Your session may have expired. Please log in again.'
          : err.response?.data?.message ||
            err.message ||
            'Unable to save your recovery check-in. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const recoveryScore = calculateScore(form)

  const scoreLabel =
    recoveryScore >= 75
      ? 'Feeling ready'
      : recoveryScore >= 50
        ? 'Take it steady'
        : 'Prioritize rest'

  const historyEntries = [...history]
    .sort((a, b) => getDateKey(b).localeCompare(getDateKey(a)))
    .slice(0, 5)

  const inputClass =
    'w-full rounded-xl border border-[#E8DFEF] bg-[#FCFAFD] px-4 py-3 text-sm outline-none transition focus:border-[#B89ACF] focus:ring-2 focus:ring-[#EDE3F6]'

  return (
    <div className="space-y-7">
      <section className="fitnect-enter relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E9DDF6] via-[#F5E8F5] to-[#FBE8D5] p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/60 blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.8px] text-[#8D6BA4]">
            Recovery & rest
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-[-1.3px] text-[#302442] sm:text-4xl">
            Progress needs recovery.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#81728E]">
            Reflect on your sleep, mood, energy and muscle soreness before
            deciding how hard to train today.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-semibold text-[#725580]">
              {new Date(`${today}T12:00:00Z`).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC',
              })}
            </span>

            <span className="rounded-xl bg-[#302442] px-4 py-3 text-xs font-bold text-white">
              Daily recovery check-in
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadRecovery}
            disabled={loading}
            className="font-bold underline disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div
          role="status"
          className="rounded-2xl border border-[#ECE6F2] bg-white p-10 text-center text-sm text-[#92849D]"
        >
          Loading your recovery data...
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#ECE6F2] bg-white p-5">
              <p className="text-xs font-medium text-[#92849D]">
                Sleep duration
              </p>
              <p className="mt-3 text-3xl font-bold text-[#302442]">
                {form.sleepHours}
                <span className="ml-1 text-sm font-medium text-[#9C8EAA]">
                  hrs
                </span>
              </p>
              <p className="mt-2 text-xs text-[#9889A2]">
                Your reported sleep
              </p>
            </article>

            <article className="rounded-2xl border border-[#ECE6F2] bg-white p-5">
              <p className="text-xs font-medium text-[#92849D]">Energy level</p>
              <p className="mt-3 text-3xl font-bold text-[#302442]">
                {form.energy}
                <span className="ml-1 text-sm font-medium text-[#9C8EAA]">
                  /10
                </span>
              </p>
              <p className="mt-2 text-xs text-[#9889A2]">
                How energized you feel
              </p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-[#E5D9F0] bg-gradient-to-br from-[#F7F1FC] to-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#92849D]">
                    Check-in score
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-[#302442]">
                    {recoveryScore}
                    <span className="ml-1 text-sm font-medium text-[#9C8EAA]">
                      /100
                    </span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9DDF6] text-lg font-bold text-[#78578F]">
                  {recoveryScore >= 75 ? '↗' : recoveryScore >= 50 ? '−' : '↓'}
                </div>
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-[#EDE5F4]"
                role="progressbar"
                aria-label="Illustrative recovery check-in score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={recoveryScore}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${recoveryScore >= 75 ? 'bg-[#86B99A]' : recoveryScore >= 50 ? 'bg-[#E9B77D]' : 'bg-[#D99AB9'}`}
                  style={{ width: `${recoveryScore}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#9889A2]">
                Illustrative only · Not a medical measure
              </p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
                Daily reflection
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#302442]">
                How recovered do you feel?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#92849D]">
                Record how you feel today. Your check-in is saved to your
                FitNect account.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <label
                    htmlFor="recovery-mood"
                    className="mb-2 block text-sm font-semibold text-[#493956]"
                  >
                    How is your mood?
                  </label>
                  <select
                    id="recovery-mood"
                    value={form.mood}
                    onChange={(event) =>
                      updateField('mood', event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="okay">Okay</option>
                    <option value="low">Low</option>
                    <option value="bad">Bad</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="recovery-sleep"
                    className="mb-2 block text-sm font-semibold text-[#493956]"
                  >
                    Sleep last night (hours)
                  </label>
                  <input
                    id="recovery-sleep"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={form.sleepHours}
                    onChange={(event) => {
                      const value = event.target.value
                      if (
                        value === '' ||
                        (Number(value) >= 0 && Number(value) <= 24)
                      ) {
                        updateField('sleepHours', value)
                      }
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="recovery-sleep-quality"
                    className="mb-2 block text-sm font-semibold text-[#493956]"
                  >
                    Sleep quality
                  </label>
                  <select
                    id="recovery-sleep-quality"
                    value={form.sleepQuality}
                    onChange={(event) =>
                      updateField('sleepQuality', event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E7F1E9] bg-[#FBFEFC] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label
                        htmlFor="recovery-energy"
                        className="text-sm font-semibold text-[#493956]"
                      >
                        Energy level
                      </label>
                      <span className="rounded-full bg-[#E5F4E9] px-3 py-1 text-xs font-bold text-[#4C8C68]">
                        {form.energy}/10
                      </span>
                    </div>
                    <input
                      id="recovery-energy"
                      type="range"
                      min="1"
                      max="10"
                      value={form.energy}
                      onChange={(event) =>
                        updateField('energy', Number(event.target.value))
                      }
                      className="w-full cursor-pointer accent-[#7CB993]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[#9C8EA6]">
                      <span>Very low</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#F6E6D8] bg-[#FFFCF8] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label
                        htmlFor="recovery-soreness"
                        className="text-sm font-semibold text-[#493956]"
                      >
                        Muscle soreness
                      </label>
                      <span className="rounded-full bg-[#FBE8D8] px-3 py-1 text-xs font-bold text-[#A56E43]">
                        {form.soreness}/5
                      </span>
                    </div>
                    <input
                      id="recovery-soreness"
                      type="range"
                      min="1"
                      max="5"
                      value={form.soreness}
                      onChange={(event) =>
                        updateField('soreness', Number(event.target.value))
                      }
                      className="w-full cursor-pointer accent-[#D99B68]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[#9C8EA6]">
                      <span>None</span>
                      <span>Very sore</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#EAE0F2] bg-[#FDFBFE] p-4 sm:col-span-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label
                        htmlFor="recovery-stress"
                        className="text-sm font-semibold text-[#493956]"
                      >
                        Stress level
                      </label>
                      <span className="rounded-full bg-[#F3E8F8] px-3 py-1 text-xs font-bold text-[#875E9E]">
                        {form.stress}/5
                      </span>
                    </div>
                    <input
                      id="recovery-stress"
                      type="range"
                      min="1"
                      max="5"
                      value={form.stress}
                      onChange={(event) =>
                        updateField('stress', Number(event.target.value))
                      }
                      className="w-full cursor-pointer accent-[#A879C4]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[#9C8EA6]">
                      <span>Relaxed</span>
                      <span>Very stressed</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="recovery-notes"
                    className="mb-2 block text-sm font-semibold text-[#493956]"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="recovery-notes"
                    rows="3"
                    maxLength="500"
                    value={form.notes}
                    onChange={(event) =>
                      updateField('notes', event.target.value)
                    }
                    placeholder="Anything affecting your recovery today?"
                    className={`${inputClass} resize-y placeholder:text-[#B2A6BB]`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                aria-busy={saving}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#332743] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(51,39,67,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4A365D] hover:shadow-[0_12px_24px_rgba(51,39,67,0.18)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {saving ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Saving check-in...
                  </>
                ) : (
                  <>
                    Save recovery check-in
                    <span
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </>
                )}
              </button>

              {savedMessage && (
                <div
                  role="status"
                  className="mt-3 flex items-start gap-3 rounded-xl border border-[#CFE9D7] bg-[#F0FAF3] px-4 py-3.5 text-xs leading-5 text-[#477B59]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D8F0DF] text-sm font-bold">
                    ✓
                  </span>
                  <div>
                    <p className="font-bold">Check-in saved</p>
                    <p className="mt-0.5">{savedMessage}</p>
                  </div>
                </div>
              )}
            </article>

            <div className="space-y-6">
              <article className="rounded-[24px] bg-gradient-to-br from-[#EDE3F7] to-[#F7EAF5] p-6 sm:p-7">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#9977AB]">
                  Your reflection
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#382749]">
                  {scoreLabel}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#887792]">
                  {recoveryScore >= 75
                    ? 'Your reported answers look relatively positive. Keep listening to your body and adjust training to how you feel.'
                    : recoveryScore >= 50
                      ? 'Consider a comfortable session and monitor how you feel. Reduce intensity if you are unusually tired or sore.'
                      : 'Consider prioritizing rest or gentle movement. Avoid pushing through pain or unusual fatigue.'}
                </p>

                <p className="mt-4 rounded-xl border border-white/80 bg-white/60 p-3 text-[11px] leading-5 text-[#887792]">
                  This score is a simple demonstration calculated from your
                  answers. It is not a validated recovery metric or medical
                  advice.
                </p>
              </article>

              <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
                  Recovery habits
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#302442]">
                  Small steps, better routines
                </h2>

                <div className="mt-5 space-y-3">
                  {recoveryTips.map((tip, index) => (
                    <div
                      key={tip.title}
                      className="group flex gap-3 rounded-2xl border border-[#F0EAF4] bg-[#FDFBFE] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#E3D5EE] hover:bg-white hover:shadow-[0_8px_24px_rgba(70,45,90,0.06)]"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: tip.color }}
                        aria-hidden="true"
                      >
                        {tip.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#493956]">
                            {tip.title}
                          </h3>
                          <span className="text-[10px] font-bold tracking-wide text-[#B0A0BB]">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#92849D]">
                          {tip.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
                  Recent check-ins
                </p>

                <h2 className="mt-2 text-xl font-bold text-[#302442]">
                  Your recovery history
                </h2>

                {historyEntries.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-[#FAF7FC] p-4 text-sm leading-6 text-[#92849D]">
                    Your saved recovery entries will appear here after your
                    first check-in.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {historyEntries.map((entry, index) => {
                      const date = getDateKey(entry)
                      const score = calculateScore({
                        sleepHours: entry.sleepHours,
                        energy: entry.energy,
                        soreness: entry.soreness,
                        stress: entry.stress,
                      })
                      const scoreTone =
                              className={`h-full rounded-full ${score >= 75 ? 'bg-[#86B99A]' : score >= 50 ? 'bg-[#E9B77D]' : 'bg-[#D99AB9]'}`}
                          ? 'bg-[#E7F5EC] text-[#4F8966]'
                          : score >= 50
                            ? 'bg-[#FFF1DF] text-[#A56E43]'
                            : 'bg-[#F9E8EF] text-[#A45172]'

                      return (
                        <div
                          key={entry._id || `${date}-${index}`}
                          className="rounded-2xl border border-[#F0EAF4] bg-[#FDFBFE] p-4 transition duration-200 hover:border-[#E3D5EE] hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE3F7] text-xs font-bold text-[#78578F]">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#493956]">
                                  {formatDate(date, today)}
                                </p>
                                <p className="mt-1 text-xs text-[#9A8CA5]">
                                  {entry.sleepHours} hrs sleep <span className="px-1">·</span> Energy {entry.energy}/10
                                </p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${scoreTone}`}>
                              {score}/100
                            </span>
                          </div>
                          <div
                            className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EDE5F4]"
                            role="progressbar"
                            aria-label={`Recovery score for ${formatDate(date, today)}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={score}
                          >
                            <div
                              className={`h-full rounded-full ${score >= 75 ? 'bg-[#86B99A]' : score >= 50 ? 'bg-[#E9B77D]' : 'bg-[#D99AB9]'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
