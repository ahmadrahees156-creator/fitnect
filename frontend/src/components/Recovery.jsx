
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fitnect_recovery'

const recoveryTips = [
  {
    title: 'Prioritize sleep',
    detail: 'Keep a consistent sleep schedule and allow enough time to rest.',
    icon: '☾',
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

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function readRecovery() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export default function Recovery() {
  const [today] = useState(getToday)
  const [history, setHistory] = useState(readRecovery)

  const [form, setForm] = useState({
    sleep: '8',
    energy: 4,
    soreness: 2,
    stress: 2,
    notes: '',
  })

  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const entry = history[today]

    if (entry) {
      setForm({
        sleep: String(entry.sleep ?? 8),
        energy: entry.energy ?? 4,
        soreness: entry.soreness ?? 2,
        stress: entry.stress ?? 2,
        notes: entry.notes ?? '',
      })
    }
  }, [today, history])

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
    setSavedMessage('')
  }

  const handleSave = () => {
    const entry = {
      ...form,
      sleep: Number(form.sleep),
      energy: Number(form.energy),
      soreness: Number(form.soreness),
      stress: Number(form.stress),
      updatedAt: new Date().toISOString(),
    }

    const updatedHistory = {
      ...history,
      [today]: entry,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
      setHistory(updatedHistory)
      setSavedMessage('Your recovery check-in has been saved.')
    } catch {
      setSavedMessage('Unable to save. Please check your browser storage.')
    }
  }

  const recoveryScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number(form.sleep) * 5 +
        Number(form.energy) * 10 -
        Number(form.soreness) * 5 -
        Number(form.stress) * 5
      )
    )
  )

  const scoreLabel =
    recoveryScore >= 75
      ? 'Feeling ready'
      : recoveryScore >= 50
        ? 'Take it steady'
        : 'Prioritize rest'

  const historyEntries = Object.entries(history)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 5)

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
            Reflect on your sleep, energy and muscle soreness before deciding
            how hard to train today.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-semibold text-[#725580]">
              {new Date(`${today}T12:00:00`).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </span>

            <span className="rounded-xl bg-[#302442] px-4 py-3 text-xs font-bold text-white">
              Daily recovery check-in
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#ECE6F2] bg-white p-5">
          <p className="text-xs font-medium text-[#92849D]">Sleep duration</p>
          <p className="mt-3 text-3xl font-bold text-[#302442]">
            {form.sleep}
            <span className="ml-1 text-sm font-medium text-[#9C8EAA]">hrs</span>
          </p>
          <p className="mt-2 text-xs text-[#9889A2]">Your reported sleep</p>
        </article>

        <article className="rounded-2xl border border-[#ECE6F2] bg-white p-5">
          <p className="text-xs font-medium text-[#92849D]">Energy level</p>
          <p className="mt-3 text-3xl font-bold text-[#302442]">
            {form.energy}
            <span className="ml-1 text-sm font-medium text-[#9C8EAA]">/5</span>
          </p>
          <p className="mt-2 text-xs text-[#9889A2]">How energized you feel</p>
        </article>

        <article className="rounded-2xl border border-[#ECE6F2] bg-white p-5">
          <p className="text-xs font-medium text-[#92849D]">Check-in score</p>
          <p className="mt-3 text-3xl font-bold text-[#302442]">
            {recoveryScore}
            <span className="ml-1 text-sm font-medium text-[#9C8EAA]">/100</span>
          </p>
          <p className="mt-2 text-xs text-[#9889A2]">An illustrative score, not a medical measure</p>
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
            Record how you feel today. Your answers are stored in this browser.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="recovery-sleep" className="mb-2 block text-sm font-semibold text-[#493956]">
                Sleep last night (hours)
              </label>
              <input
                id="recovery-sleep"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.sleep}
                onChange={(event) => {
                  const value = event.target.value
                  if (value === '' || (Number(value) >= 0 && Number(value) <= 24)) {
                    updateField('sleep', value)
                  }
                }}
                className="w-full rounded-xl border border-[#E8DFEF] bg-[#FCFAFD] px-4 py-3 text-sm outline-none transition focus:border-[#B89ACF] focus:ring-2 focus:ring-[#EDE3F6]"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="recovery-energy" className="text-sm font-semibold text-[#493956]">
                  Energy level
                </label>
                <span className="rounded-full bg-[#E5F4E9] px-3 py-1 text-xs font-bold text-[#4C8C68]">
                  {form.energy}/5
                </span>
              </div>
              <input
                id="recovery-energy"
                type="range"
                min="1"
                max="5"
                value={form.energy}
                onChange={(event) => updateField('energy', Number(event.target.value))}
                className="w-full accent-[#7CB993]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#9C8EA6]">
                <span>Very low</span>
                <span>Excellent</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="recovery-soreness" className="text-sm font-semibold text-[#493956]">
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
                onChange={(event) => updateField('soreness', Number(event.target.value))}
                className="w-full accent-[#D99B68]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#9C8EA6]">
                <span>None</span>
                <span>Very sore</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="recovery-stress" className="text-sm font-semibold text-[#493956]">
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
                onChange={(event) => updateField('stress', Number(event.target.value))}
                className="w-full accent-[#A879C4]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#9C8EA6]">
                <span>Relaxed</span>
                <span>Very stressed</span>
              </div>
            </div>

            <div>
              <label htmlFor="recovery-notes" className="mb-2 block text-sm font-semibold text-[#493956]">
                Notes (optional)
              </label>
              <textarea
                id="recovery-notes"
                rows="3"
                maxLength="500"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Anything affecting your recovery today?"
                className="w-full resize-y rounded-xl border border-[#E8DFEF] bg-[#FCFAFD] px-4 py-3 text-sm outline-none transition placeholder:text-[#B2A6BB] focus:border-[#B89ACF] focus:ring-2 focus:ring-[#EDE3F6]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-6 w-full rounded-xl bg-[#332743] px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4A365D] active:translate-y-0"
          >
            Save recovery check-in
          </button>

          {savedMessage && (
            <p role="status" className="mt-3 rounded-xl bg-[#EAF6EE] px-4 py-3 text-xs font-medium text-[#4F8966]">
              {savedMessage}
            </p>
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
              This score is a simple demo calculation from your answers. It is not a validated recovery metric or medical advice.
            </p>
          </article>

          <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
              Recovery habits
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#302442]">
              Small steps, better routines
            </h2>

            <div className="mt-5 space-y-4">
              {recoveryTips.map((tip) => (
                <div key={tip.title} className="flex gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: tip.color }}
                  >
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#493956]">{tip.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#92849D]">{tip.detail}</p>
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
                Your saved recovery entries will appear here after your first check-in.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#F0EAF4]">
                {historyEntries.map(([date, entry]) => (
                  <div key={date} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <p className="text-sm font-semibold text-[#493956]">
                        {date === today
                          ? 'Today'
                          : new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                      </p>
                      <p className="mt-1 text-xs text-[#9A8CA5]">
                        {entry.sleep} hrs sleep · Energy {entry.energy}/5
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F0E7F8] px-3 py-1.5 text-xs font-bold text-[#78578F]">
                      {Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round(
                            Number(entry.sleep) * 5 +
                            Number(entry.energy) * 10 -
                            Number(entry.soreness) * 5 -
                            Number(entry.stress) * 5
                          )
                        )
                      )}/100
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  )
}
