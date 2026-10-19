
import { useEffect, useState } from 'react'
import {
  getTodayWellness,
  saveWellnessCheckIn,
} from '../services/wellnessService'

const initialForm = {
  mood: 'good',
  sleepHours: '7',
  sleepQuality: 'good',
  energy: 6,
  stress: 2,
  soreness: 2,
  notes: '',
}

const moods = [
  { value: 'great', label: 'Great', emoji: '😄', description: 'Feeling amazing' },
  { value: 'good', label: 'Good', emoji: '🙂', description: 'Doing well' },
  { value: 'okay', label: 'Okay', emoji: '😐', description: 'Just alright' },
  { value: 'low', label: 'Low', emoji: '😔', description: 'Need some rest' },
  { value: 'bad', label: 'Bad', emoji: '😞', description: 'A tough day' },
]

const sleepQualities = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
]

const energyLabels = {
  1: 'Exhausted',
  2: 'Very low',
  3: 'Low',
  4: 'Below average',
  5: 'Moderate',
  6: 'Good',
  7: 'Energetic',
  8: 'Very energetic',
  9: 'Excellent',
  10: 'Fully energized',
}

const stressLabels = {
  1: 'Very relaxed',
  2: 'Mostly calm',
  3: 'Moderate',
  4: 'Quite stressed',
  5: 'Highly stressed',
}

const sorenessLabels = {
  1: 'None',
  2: 'Mild',
  3: 'Moderate',
  4: 'High',
  5: 'Severe',
}

const getToday = () => new Date().toISOString().slice(0, 10)

const toForm = (record) => ({
  mood: record.mood || 'good',
  sleepHours: String(record.sleepHours ?? 7),
  sleepQuality: record.sleepQuality || 'good',
  energy: Number(record.energy ?? 6),
  stress: Number(record.stress ?? 2),
  soreness: Number(record.soreness ?? 2),
  notes: record.notes || '',
})

function SectionHeading({ number, title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4DBF4] text-xs font-bold text-[#62596F]">
          {number}
        </span>
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#151517] sm:text-lg">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-5 text-[#7E7E82]">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

function ScaleControl({
  label,
  subtitle,
  value,
  min,
  max,
  onChange,
  leftLabel,
  rightLabel,
  color = '#F373D4',
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#151517]">{label}</p>
          <p className="mt-1 text-xs text-[#7E7E82]">{subtitle}</p>
        </div>
        <span className="flex h-11 min-w-12 items-center justify-center rounded-xl bg-[#F8F5FC] px-3 text-lg font-bold text-[#151517]">
          {value}
          <span className="ml-0.5 text-xs font-medium text-[#7E7E82]">
            /{max}
          </span>
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        style={{ '--range-color': color }}
        className="wellness-range mt-5 w-full cursor-pointer"
      />

      <div className="mt-2 flex justify-between text-xs font-medium text-[#7E7E82]">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

export default function WellnessCheckIn() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasTodayCheckIn, setHasTodayCheckIn] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    const loadToday = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await getTodayWellness()

        if (!active) return

        if (response.success === false) {
          throw new Error(response.message || 'Could not load your check-in.')
        }

        if (response.wellness) {
          setForm(toForm(response.wellness))
          setHasTodayCheckIn(true)
        } else {
          setForm(initialForm)
          setHasTodayCheckIn(false)
        }
      } catch (error) {
        if (!active) return

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            'Could not load your wellness check-in. Please try again.'
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    loadToday()

    return () => {
      active = false
    }
  }, [])

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSavedMessage('')
    setErrorMessage('')
  }

  const handleSave = async () => {
    const sleepHours = Number(form.sleepHours)

    if (
      form.sleepHours.trim() === '' ||
      !Number.isFinite(sleepHours) ||
      sleepHours < 0 ||
      sleepHours > 24
    ) {
      setErrorMessage('Sleep hours must be between 0 and 24.')
      return
    }

    if (form.notes.length > 500) {
      setErrorMessage('Notes cannot exceed 500 characters.')
      return
    }

    const payload = {
      date: getToday(),
      mood: form.mood,
      energy: Number(form.energy),
      sleepHours,
      sleepQuality: form.sleepQuality,
      stress: Number(form.stress),
      soreness: Number(form.soreness),
      notes: form.notes.trim(),
    }

    setSaving(true)
    setSavedMessage('')
    setErrorMessage('')

    try {
      const response = await saveWellnessCheckIn(payload)

      if (response.success === false) {
        throw new Error(response.message || 'Could not save your check-in.')
      }

      if (response.wellness) {
        setForm(toForm(response.wellness))
      }

      setHasTodayCheckIn(true)
      setSavedMessage('Your wellness check-in has been saved successfully.')
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Could not save your check-in. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#EAE4F1] bg-white px-4 py-3 text-sm text-[#151517] outline-none transition placeholder:text-[#A4A0AA] focus:border-[#B9A4D7] focus:ring-4 focus:ring-[#E4DBF4]/60'

  const cardClass =
    'rounded-2xl border border-[#ECE7F2] bg-white p-5 shadow-[0_3px_18px_rgba(35,25,55,0.025)] transition-shadow duration-300 hover:shadow-[0_8px_28px_rgba(35,25,55,0.045)] sm:p-6'

  if (loading) {
    return (
      <section className="rounded-3xl border border-[#ECE7F2] bg-white p-8 sm:p-12">
        <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E4DBF4] border-t-[#F373D4]" />
          <div>
            <p className="font-semibold text-[#151517]">Getting things ready</p>
            <p className="mt-1 text-sm text-[#7E7E82]">
              Loading your wellness check-in...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-[#151517]">
      <style>{`
        .wellness-range {
          height: 6px;
          appearance: none;
          -webkit-appearance: none;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--range-color) 0%,
            var(--range-color) calc((var(--value, 1) - var(--min, 1)) / (var(--max, 10) - var(--min, 1)) * 100%),
            #eee9f3 calc((var(--value, 1) - var(--min, 1)) / (var(--max, 10) - var(--min, 1)) * 100%),
            #eee9f3 100%
          );
          accent-color: var(--range-color);
        }
        .wellness-range:focus-visible {
          outline: 3px solid #E4DBF4;
          outline-offset: 5px;
        }
        .wellness-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          border: 4px solid white;
          background: var(--range-color);
          box-shadow: 0 0 0 1px var(--range-color), 0 2px 6px #00000012;
        }
        .wellness-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 4px solid white;
          background: var(--range-color);
          box-shadow: 0 0 0 1px var(--range-color), 0 2px 6px #00000012;
        }
        @media (prefers-reduced-motion: reduce) {
          .wellness-range { scroll-behavior: auto; }
        }
      `}</style>

      <header className="relative overflow-hidden rounded-3xl border border-[#E4DBF4] bg-[#F8F5FC] p-6 sm:p-8 lg:p-9">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#FDC381]/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-[#F373D4]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DCEF] bg-white/80 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#8CC9A3]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#62596F]">
                Your daily reset
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#151517] sm:text-4xl">
              Check in with
              <br />
              <span className="text-[#8975A5]">yourself.</span>
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-[#77717F] sm:text-base">
              A little awareness goes a long way. Track how you feel, how you
              recover, and what your body needs today.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start rounded-2xl border border-white bg-white/80 p-4 shadow-sm sm:min-w-44 sm:flex-col sm:items-center sm:justify-center sm:self-auto sm:p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDC381]/40 text-3xl">
              {moods.find((mood) => mood.value === form.mood)?.emoji || '🌿'}
            </div>
            <div className="sm:text-center">
              <p className="text-sm font-bold text-[#151517]">
                {hasTodayCheckIn ? 'You checked in' : 'Make time for you'}
              </p>
              <p className="mt-1 text-xs text-[#7E7E82]">
                {hasTodayCheckIn ? 'Today’s entry is saved' : 'Takes about 1 minute'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap items-center gap-2 border-t border-[#E5DCEF] pt-5">
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#62596F]">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
            })}
          </span>
          <span className="rounded-lg bg-[#CAECD6]/70 px-3 py-2 text-xs font-semibold text-[#3D7051]">
            Wellness journal
          </span>
          {hasTodayCheckIn && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#CAECD6]/70 px-3 py-2 text-xs font-semibold text-[#3D7051]">
              <span>✓</span> Saved for today
            </span>
          )}
        </div>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
            !
          </span>
          <p className="pt-0.5">{errorMessage}</p>
        </div>
      )}

      {savedMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-[#BFE4CC] bg-[#F0FAF3] p-4 text-sm text-[#356B49]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#CAECD6] font-bold">
            ✓
          </span>
          <div>
            <p className="font-bold">All caught up!</p>
            <p className="mt-0.5">{savedMessage}</p>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <SectionHeading
          number="01"
          title="Your mood"
          subtitle="How has today been feeling so far?"
          right={
            <span className="rounded-lg bg-[#F8F5FC] px-3 py-1.5 text-xs font-semibold text-[#8975A5]">
              Choose one
            </span>
          }
        />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {moods.map((mood) => {
            const selected = form.mood === mood.value

            return (
              <button
                key={mood.value}
                type="button"
                onClick={() => handleChange('mood', mood.value)}
                aria-pressed={selected}
                className={`group relative flex min-h-28 flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition duration-200 hover:-translate-y-0.5 ${
                  selected
                    ? 'border-[#B9A4D7] bg-[#F8F5FC] shadow-[0_0_0_2px_#E4DBF4]'
                    : 'border-[#EEE9F3] bg-white hover:border-[#D8C9E8] hover:bg-[#FBF9FD]'
                }`}
              >
                {selected && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#8975A5] text-[9px] font-bold text-white">
                    ✓
                  </span>
                )}
                <span className="text-3xl transition duration-200 group-hover:scale-110">
                  {mood.emoji}
                </span>
                <span className="mt-2 text-sm font-bold text-[#151517]">
                  {mood.label}
                </span>
                <span className="mt-1 text-[10px] text-[#89838F]">
                  {mood.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={cardClass}>
          <SectionHeading
            number="02"
            title="Sleep & recovery"
            subtitle="Rest is part of your progress."
            right={<span className="text-xl">🌙</span>}
          />

          <div className="mt-6 rounded-2xl bg-[#F8F5FC] p-4 sm:p-5">
            <label
              htmlFor="sleepHours"
              className="text-xs font-semibold uppercase tracking-wider text-[#77717F]"
            >
              Hours slept
            </label>

            <div className="mt-3 flex items-end gap-2">
              <input
                id="sleepHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.sleepHours}
                onChange={(event) =>
                  handleChange('sleepHours', event.target.value)
                }
                className="w-28 border-b-2 border-[#D9CCE8] bg-transparent pb-1 text-4xl font-bold tracking-tight text-[#151517] outline-none focus:border-[#8975A5]"
              />
              <span className="pb-2 text-sm text-[#7E7E82]">hours</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[4, 5, 6, 7, 8, 9].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => handleChange('sleepHours', String(hours))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    Number(form.sleepHours) === hours
                      ? 'bg-[#8975A5] text-white'
                      : 'bg-white text-[#77717F] hover:bg-[#E4DBF4]'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-[#151517]">
              How well did you sleep?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {sleepQualities.map((quality) => {
                const selected = form.sleepQuality === quality.value

                return (
                  <button
                    key={quality.value}
                    type="button"
                    onClick={() =>
                      handleChange('sleepQuality', quality.value)
                    }
                    aria-pressed={selected}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      selected
                        ? 'border-[#B9A4D7] bg-[#E4DBF4]/60 text-[#62596F]'
                        : 'border-[#EEE9F3] bg-white text-[#77717F] hover:bg-[#FBF9FD]'
                    }`}
                  >
                    {quality.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <SectionHeading
            number="03"
            title="Energy levels"
            subtitle="Tune in to the energy you have."
            right={<span className="text-xl">☀️</span>}
          />

          <div className="mt-6 rounded-2xl bg-[#FFF8EF] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#151517]">
                Your current energy
              </span>
              <span className="rounded-xl bg-[#FDC381]/50 px-3 py-1.5 text-sm font-bold text-[#795329]">
                {form.energy}/10
              </span>
            </div>

            <ScaleControl
              label="Energy"
              subtitle={energyLabels[form.energy]}
              value={form.energy}
              min={1}
              max={10}
              onChange={(value) => handleChange('energy', value)}
              leftLabel="Running low"
              rightLabel="Full of energy"
              color="#D99443"
            />

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#F4E4CF] bg-white/80 p-3">
              <span className="text-lg">💡</span>
              <p className="text-xs leading-5 text-[#81715F]">
                Listen to your body. Your energy can help you reflect on
                training and recovery needs.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <ScaleControl
              label="Stress"
              subtitle={stressLabels[form.stress]}
              value={form.stress}
              min={1}
              max={5}
              onChange={(value) => handleChange('stress', value)}
              leftLabel="Calm"
              rightLabel="Very stressed"
              color="#F373D4"
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <SectionHeading
          number="04"
          title="Muscle soreness"
          subtitle="How is your body feeling after movement or training?"
          right={<span className="text-xl">🌿</span>}
        />

        <div className="mt-6 rounded-2xl bg-[#F3FAF5] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#151517]">
                Current soreness
              </p>
              <p className="mt-1 text-xs text-[#7E7E82]">
                Choose the level that feels right.
              </p>
            </div>
            <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#477658]">
              {sorenessLabels[form.soreness]}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {[
              { value: 1, label: 'None' },
              { value: 2, label: 'Mild' },
              { value: 3, label: 'Moderate' },
              { value: 4, label: 'High' },
              { value: 5, label: 'Severe' },
            ].map((level) => {
              const selected = form.soreness === level.value

              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleChange('soreness', level.value)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-1 py-3 transition sm:py-4 ${
                    selected
                      ? 'border-[#8CC9A3] bg-white shadow-[0_0_0_2px_#CAECD6]'
                      : 'border-transparent bg-white/60 hover:border-[#CBE7D4]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      selected
                        ? 'bg-[#477658] text-white'
                        : 'bg-[#CAECD6] text-[#477658]'
                    }`}
                  >
                    {level.value}
                  </span>
                  <span className="text-[10px] font-semibold text-[#62596F] sm:text-xs">
                    {level.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <SectionHeading
          number="05"
          title="A note to yourself"
          subtitle="Anything else you want to remember about today?"
          right={<span className="text-xl">✎</span>}
        />

        <textarea
          id="wellnessNotes"
          rows={4}
          maxLength={500}
          value={form.notes}
          onChange={(event) => handleChange('notes', event.target.value)}
          placeholder="A tough session, a small win, how you feel today..."
          className={`${inputClass} mt-5 min-h-28 resize-y leading-6`}
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-[#7E7E82]">
            Just for your personal wellness journal.
          </p>
          <p className="shrink-0 text-xs font-medium text-[#7E7E82]">
            {form.notes.length}/500
          </p>
        </div>
      </div>

      <footer className="rounded-2xl border border-[#EAE4F1] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CAECD6]/70 text-lg">
              ✓
            </span>
            <div>
              <p className="text-sm font-bold text-[#151517]">
                {hasTodayCheckIn ? 'Your check-in is up to date' : 'One minute for your wellbeing'}
              </p>
              <p className="mt-1 max-w-md text-xs leading-5 text-[#7E7E82]">
                {hasTodayCheckIn
                  ? 'You can update today’s entry any time.'
                  : 'Your responses will be saved to your FitNect account.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#151517] px-6 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#353139] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving your check-in...
              </>
            ) : (
              <>
                {hasTodayCheckIn ? 'Update check-in' : 'Save check-in'}
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </section>
  )
}
