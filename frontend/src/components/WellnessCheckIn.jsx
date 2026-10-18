
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fitnect_wellness_checkins'

const initialForm = {
  mood: 'Good',
  sleep: '7',
  energy: 3,
  soreness: 2,
  notes: '',
}

const moods = [
  { label: 'Great', emoji: '😊' },
  { label: 'Good', emoji: '🙂' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Tired', emoji: '😴' },
]

const energyLabels = ['Very low', 'Low', 'Balanced', 'High', 'Excellent']
const sorenessLabels = ['None', 'Mild', 'Moderate', 'High', 'Severe']

function readCheckIns() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function WellnessCheckIn() {
  const [form, setForm] = useState(initialForm)
  const [checkIns, setCheckIns] = useState(readCheckIns)
  const [savedMessage, setSavedMessage] = useState('')
  const today = getToday()

  useEffect(() => {
    const todaysEntry = checkIns.find((entry) => entry.date === today)

    if (todaysEntry) {
      setForm({
        mood: todaysEntry.mood,
        sleep: String(todaysEntry.sleep),
        energy: todaysEntry.energy,
        soreness: todaysEntry.soreness,
        notes: todaysEntry.notes || '',
      })
    }
  }, [today])

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
    setSavedMessage('')
  }

  function handleSave() {
    const sleepHours = Number(form.sleep)

    if (
      form.sleep === '' ||
      !Number.isFinite(sleepHours) ||
      sleepHours < 0 ||
      sleepHours > 24
    ) {
      setSavedMessage('Enter valid sleep hours between 0 and 24.')
      return
    }

    const entry = {
      ...form,
      sleep: sleepHours,
      date: today,
      updatedAt: new Date().toISOString(),
    }

    const updated = [
      entry,
      ...checkIns.filter((item) => item.date !== today),
    ].sort((a, b) => b.date.localeCompare(a.date))

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setCheckIns(updated)
      setSavedMessage('Your wellness check-in has been saved.')
    } catch {
      setSavedMessage('Could not save. Check your browser storage.')
    }
  }

  const todaysEntry = checkIns.find((entry) => entry.date === today)

  return (
    <div className="fitnect-enter space-y-7">
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#332743] via-[#49345B] to-[#76518B] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#E7A9E5]/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#EBC7EF]">
            Pause. Reflect. Reset.
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            How are you feeling today?
          </h2>

          <p className="mt-3 max-w-lg text-sm leading-6 text-[#DED2E7]">
            Your daily check-in helps you notice patterns in your mood,
            sleep, energy and recovery.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{checkIns.length}</p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Days recorded
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">
                {todaysEntry ? 'Done' : 'Open'}
              </p>
              <p className="mt-1 text-[11px] text-[#DED2E7]">
                Today's check-in
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
              Daily wellness
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#302442]">
              Your check-in
            </h2>
            <p className="mt-2 text-sm text-[#92879F]">
              Take a moment to reflect on how your body feels.
            </p>
          </div>

          <div className="mt-7">
            <label className="text-sm font-bold text-[#493456]">
              1. How is your mood?
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {moods.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => updateField('mood', item.label)}
                  aria-pressed={form.mood === item.label}
                  className={`rounded-2xl border p-3 transition duration-200 hover:-translate-y-0.5 ${
                    form.mood === item.label
                      ? 'border-[#C6A6DD] bg-[#F4EAF9] text-[#694782]'
                      : 'border-[#ECE6F2] bg-white text-[#8F819A] hover:border-[#DCC7E8]'
                  }`}
                >
                  <span className="block text-2xl">{item.emoji}</span>
                  <span className="mt-2 block text-xs font-bold">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <label
              htmlFor="wellness-sleep"
              className="text-sm font-bold text-[#493456]"
            >
              2. How many hours did you sleep?
            </label>

            <div className="mt-3 flex items-center gap-3">
              <input
                id="wellness-sleep"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.sleep}
                onChange={(event) =>
                  updateField('sleep', event.target.value)
                }
                className="w-28 rounded-xl border border-[#E8DDF0] bg-[#FCFAFE] px-4 py-3 text-sm font-bold text-[#493456] outline-none focus:border-[#B88AD5]"
              />
              <span className="text-sm text-[#92879F]">hours</span>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#493456]">
                3. How is your energy?
              </label>
              <span className="rounded-full bg-[#F2EAF8] px-3 py-1 text-xs font-bold text-[#795792]">
                {energyLabels[form.energy - 1]}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={form.energy}
              onChange={(event) =>
                updateField('energy', Number(event.target.value))
              }
              aria-label="Energy level"
              className="mt-4 w-full cursor-pointer accent-[#A978C9]"
            />

            <div className="flex justify-between text-[10px] text-[#9B8DA5]">
              <span>Very low</span>
              <span>Excellent</span>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#493456]">
                4. Muscle soreness
              </label>
              <span className="rounded-full bg-[#FBEDE4] px-3 py-1 text-xs font-bold text-[#A66D49]">
                {sorenessLabels[form.soreness - 1]}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={form.soreness}
              onChange={(event) =>
                updateField('soreness', Number(event.target.value))
              }
              aria-label="Muscle soreness level"
              className="mt-4 w-full cursor-pointer accent-[#D99B72]"
            />

            <div className="flex justify-between text-[10px] text-[#9B8DA5]">
              <span>None</span>
              <span>Severe</span>
            </div>
          </div>

          <div className="mt-7">
            <label
              htmlFor="wellness-notes"
              className="text-sm font-bold text-[#493456]"
            >
              5. Anything else to note?
              <span className="ml-2 font-normal text-[#A69AAE]">
                Optional
              </span>
            </label>

            <textarea
              id="wellness-notes"
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(event) =>
                updateField('notes', event.target.value)
              }
              placeholder="How did your day or workout feel?"
              className="mt-3 w-full resize-y rounded-xl border border-[#E8DDF0] bg-[#FCFAFE] px-4 py-3 text-sm text-[#493456] outline-none placeholder:text-[#B2A6BB] focus:border-[#B88AD5]"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-6 w-full rounded-xl bg-[#332743] px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4A365D]"
          >
            {todaysEntry ? 'Update today’s check-in' : 'Save check-in'} →
          </button>

          {savedMessage && (
            <p
              role="status"
              className={`mt-3 rounded-xl px-4 py-3 text-xs font-medium ${
                savedMessage.startsWith('Your')
                  ? 'bg-[#EAF6EE] text-[#4F8966]'
                  : 'bg-[#FBEDE7] text-[#A15C48]'
              }`}
            >
              {savedMessage}
            </p>
          )}

          <p className="mt-4 text-[10px] leading-5 text-[#AA9DB3]">
            This check-in is saved in this browser only. It is not synced
            to your FitNect account or backend.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
              Today's reflection
            </p>

            <h3 className="mt-2 text-xl font-bold text-[#302442]">
              Your wellness snapshot
            </h3>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[#F8F3FC] p-3">
                <span className="text-xs text-[#887795]">Mood</span>
                <span className="text-sm font-bold text-[#694782]">
                  {form.mood}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#F4F9F5] p-3">
                <span className="text-xs text-[#78917E]">Sleep</span>
                <span className="text-sm font-bold text-[#4C7D5D]">
                  {form.sleep || '—'} hrs
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#FCF4EB] p-3">
                <span className="text-xs text-[#A18469]">Energy</span>
                <span className="text-sm font-bold text-[#946A46]">
                  {energyLabels[form.energy - 1]}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#FCEFF6] p-3">
                <span className="text-xs text-[#A77D98]">Soreness</span>
                <span className="text-sm font-bold text-[#9B5D83]">
                  {sorenessLabels[form.soreness - 1]}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] bg-gradient-to-br from-[#EDE3F7] to-[#F7EAF5] p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-xl">
              ✦
            </div>

            <h3 className="mt-4 text-lg font-bold text-[#493456]">
              Listen to your body
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#8D7C9C]">
              Use your check-ins to reflect on patterns over time.
              Consider an easier session when you feel unusually tired
              or sore.
            </p>

            <p className="mt-3 text-[10px] leading-5 text-[#9988A5]">
              These reflections are for personal tracking, not medical
              assessment or injury diagnosis.
            </p>
          </section>

          <section className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
              Recent check-ins
            </p>

            <h3 className="mt-2 text-lg font-bold text-[#302442]">
              Your history
            </h3>

            {checkIns.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[#FCFAFE] p-4 text-sm leading-6 text-[#92879F]">
                Your saved daily reflections will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {checkIns.slice(0, 5).map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-center justify-between gap-3 border-b border-[#F0EAF4] pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#493456]">
                        {entry.date === today ? 'Today' : entry.date}
                      </p>
                      <p className="mt-1 text-xs text-[#92849D]">
                        {entry.sleep} hrs sleep · Energy {entry.energy}/5
                      </p>
                    </div>

                    <span className="rounded-full bg-[#F3EDF9] px-3 py-1.5 text-xs font-semibold text-[#806991]">
                      {entry.mood}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

export default WellnessCheckIn
