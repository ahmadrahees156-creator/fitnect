import { useEffect, useState } from 'react'
import { predictInjuryRisk } from '../services/injuryRiskService'
import { getMyFitnessProfile } from '../services/fitnessProfileService'

const initialForm = {
  heart_rate: '',
  stress_level: '',
  hydration_level: '',
  sleep_quality: '',
  recovery_score: '',
  step_count: '',
  training_load: '',
  training_intensity: '',
  training_duration: '',
  fatigue_index: '',
  sport_type: 'Other',
  gender: '',
  age: '',
  bmi: '',
}

const numericFields = [
  { name: 'heart_rate', label: 'Heart rate', unit: 'bpm', min: 1, max: 250 },
  {
    name: 'stress_level',
    label: 'Stress level',
    unit: 'model scale (0.10–0.95)',
    min: 0.1,
    max: 0.95,
    step: 0.01,
  },
  {
    name: 'hydration_level',
    label: 'Hydration level',
    unit: 'percentage (45–100)',
    min: 45,
    max: 100,
  },
  {
    name: 'sleep_quality',
    label: 'Sleep quality',
    unit: 'model score (1.16–10)',
    min: 1,
    max: 10,
    step: 0.1,
  },
  {
    name: 'recovery_score',
    label: 'Recovery score',
    unit: 'model score (0–100)',
    min: 0,
    max: 100,
  },
  {
    name: 'step_count',
    label: 'Steps today',
    unit: 'steps',
    min: 0,
    max: 100000,
  },
  {
    name: 'training_load',
    label: 'Training load',
    unit: 'model value (150–2500)',
    min: 150,
    max: 2500,
  },
  {
    name: 'training_intensity',
    label: 'Training intensity',
    unit: 'RPE (2–10)',
    min: 2,
    max: 10,
  },
  {
    name: 'training_duration',
    label: 'Training duration',
    unit: 'minutes',
    min: 1,
    max: 600,
  },
  {
    name: 'fatigue_index',
    label: 'Fatigue index',
    unit: 'model value (15–270)',
    min: 15,
    max: 270,
  },
  { name: 'age', label: 'Age', unit: 'years', min: 1, max: 120 },
  {
    name: 'bmi',
    label: 'BMI',
    unit: 'kg/m²',
    min: 1,
    max: 100,
    step: 0.1,
  },
]

const preventionTips = [
  {
    title: 'Warm up properly',
    detail:
      'Start sessions with 5–10 minutes of easy movement and dynamic mobility.',
    tag: 'BEFORE TRAINING',
  },
  {
    title: 'Increase load gradually',
    detail:
      'Avoid sudden jumps in workout duration, intensity or weekly frequency.',
    tag: 'TRAINING HABIT',
  },
  {
    title: 'Make recovery count',
    detail:
      'Prioritize sleep, hydration and rest. Adjust your session if you feel unwell.',
    tag: 'DAILY RECOVERY',
  },
]

function getErrorMessage(error) {
  const status = error?.response?.status
  const serverMessage =
    error?.response?.data?.message || error?.response?.data?.error

  if (status === 400) {
    return (
      serverMessage ||
      'Some values are missing or invalid. Check the fields and try again.'
    )
  }

  if (status === 401) {
    return 'Your session may have expired. Please sign in again and retry.'
  }

  if (status === 502 || status === 503) {
    return 'The prediction service is temporarily unavailable. Please try again later.'
  }

  if (!error?.response) {
    return 'Could not reach FitNect. Check your internet connection and try again.'
  }

  return (
    serverMessage ||
    'Something went wrong while getting the prediction. Please try again.'
  )
}

function InjuryRisk() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    let active = true

    const loadProfileDefaults = async () => {
      try {
        const response = await getMyFitnessProfile()
        const profile = response?.profile || {}
        const heightCm = Number(profile.heightCm)
        const weightKg = Number(profile.weightKg)
        const calculatedBmi =
          heightCm > 0 && weightKg > 0
            ? Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1))
            : ''
        const rawGender = String(profile.gender || '').toLowerCase()
        const modelGender =
          rawGender === 'male' ? 'Male' : rawGender === 'female' ? 'Female' : ''

        if (active) {
          setForm((current) => ({
            ...current,
            age: profile.age != null ? String(profile.age) : current.age,
            bmi: profile.bmi != null && Number(profile.bmi) > 0
              ? String(Number(profile.bmi).toFixed(1))
              : calculatedBmi !== '' ? String(calculatedBmi) : current.bmi,
            gender: modelGender || current.gender,
          }))
          if (!profile.age || (!calculatedBmi && !(Number(profile.bmi) > 0))) {
            setProfileMessage('Some profile details are missing. Complete your fitness profile to autofill age and BMI.')
          }
        }
      } catch {
        if (active) {
          setProfileMessage('Could not load your saved fitness profile. You can still enter age and BMI manually.')
        }
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    loadProfileDefaults()
    return () => { active = false }
  }, [])

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setResult(null)

    const missing = Object.entries(form).find(([, value]) => value === '')

    if (missing) {
      setErrorMessage(
        'Please complete every required field before running the prediction.',
      )
      return
    }

    const payload = { ...form }

    numericFields.forEach(({ name }) => {
      payload[name] = Number(form[name])
    })

    const invalid = numericFields.find(({ name, min, max }) => {
      const value = payload[name]
      return !Number.isFinite(value) || value < min || value > max
    })

    if (invalid) {
      setErrorMessage(
        `Check ${invalid.label}: enter a value from ${invalid.min} to ${invalid.max}.`,
      )
      return
    }

    setLoading(true)

    try {
      const data = await predictInjuryRisk(payload)

      if (
        !data ||
        data.success === false ||
        typeof data.severe_risk_probability !== 'number'
      ) {
        throw new Error('The prediction response was incomplete.')
      }

      setResult(data)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const riskLevel = result?.risk_level || 'Prediction ready'
  const alertRaised = Number(result?.alert) === 1

  return (
    <div className="fitnect-enter space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#E8DDF0] bg-[#E4DBF4] p-6 text-[#151517] shadow-[0_16px_45px_rgba(72,46,94,.07)] sm:p-9 lg:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#F373D4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-[#FDC381]/30 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-[#D7C6E8] bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.7px] text-[#72529A]">
              ML-powered assessment
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-1px] sm:text-4xl">
              Listen to your body.
              <br />
              <span className="text-[#8A5C20]">Train with awareness.</span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-[#68616F]">
              Enter your current wellness and training measurements to request
              a severe-injury risk estimate from FitNect's prediction service.
            </p>
          </div>

          <div className="flex min-w-[175px] flex-col items-center justify-center rounded-[24px] border border border-white/70 bg-white/65 p-6 text-center shadow-sm backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl text-[#FDC381]">
              {result ? (alertRaised ? '!' : '✓') : '↗'}
            </div>

            <p className="mt-4 text-lg font-bold">
              {result
                ? `${Number(result.severe_risk_percent).toFixed(1)}%`
                : 'Ready when you are'}
            </p>

            <p className="mt-1 text-xs text-[#7E7E82]">
              {result ? 'Severe-risk probability' : 'Complete the assessment'}
            </p>

            {result && (
              <span className="mt-3 rounded-full bg-[#F8F5FC] px-3 py-1 text-[10px] font-semibold text-[#5C4675]">
                {riskLevel} risk
              </span>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7A9D]">
            Prediction inputs
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#151517] sm:text-3xl">
            Your training and recovery details
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#7E7E82]">
            Use values measured or recorded for you. The stress, sleep,
            recovery, training-load and fatigue fields must follow the model's
            input scale; don't guess if you don't know those values.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#EEEAF3] bg-white p-5 shadow-[0_8px_28px_rgba(72,46,94,.035)] sm:p-7"
        >
          {profileLoading ? (
            <p className="mb-4 rounded-2xl border border-[#E7DDF4] bg-[#F8F4FD] px-4 py-3 text-sm text-[#6D5684]">Loading saved profile details…</p>
          ) : profileMessage ? (
            <p role="status" className="mb-4 rounded-xl bg-[#F8F3FC] px-4 py-3 text-sm text-[#795B96]">{profileMessage}</p>
          ) : (
            <p className="mb-4 rounded-2xl border border-[#D2EBDD] bg-[#F0F9F3] px-4 py-3 text-sm text-[#397A52]">Age and BMI were prefilled from your saved profile where available. Confirm today's training and recovery values below.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {numericFields.map((field) => (
              <label key={field.name} className="block">
                <span className="text-sm font-bold text-[#40304F]">
                  {field.label}
                </span>

                <span className="mt-1 block text-[11px] text-[#92879F]">
                  {field.unit}
                </span>

                <input
                  type="number"
                  name={field.name}
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  value={form[field.name]}
                  onChange={(event) =>
                    updateField(field.name, event.target.value)
                  }
                  readOnly={(field.name === 'age' || field.name === 'bmi') && Boolean(form[field.name])}
                  required
                  className="mt-2 w-full rounded-xl border border-[#E5DCEC] bg-[#FCFAFE] px-3.5 py-3 text-sm text-[#302442] outline-none transition placeholder:text-[#AAA0B4] focus:border-[#A98BC5] focus:ring-2 focus:ring-[#E4DBF4]"
                  placeholder="Enter value"
                />
              </label>
            ))}

            <label className="block">
              <span className="text-sm font-bold text-[#40304F]">
                Sport type
              </span>

              <span className="mt-1 block text-[11px] text-[#92879F]">
                Choose the model category
              </span>

              <select
                value={form.sport_type}
                onChange={(event) =>
                  updateField('sport_type', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#E5DCEC] bg-[#FCFAFE] px-3.5 py-3 text-sm text-[#302442] outline-none focus:border-[#A98BC5] focus:ring-2 focus:ring-[#E4DBF4]"
                required
              >
                {['Basketball', 'Other', 'Soccer', 'Track'].map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#40304F]">Gender</span>

              <span className="mt-1 block text-[11px] text-[#92879F]">
                As required by the model
              </span>

              <select
                value={form.gender}
                onChange={(event) =>
                  updateField('gender', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#E9E1EF] bg-[#FCFAFD] px-3.5 py-3 text-sm text-[#40304F] outline-none focus:border-[#B99ACF] focus:ring-2 focus:ring-[#F1E8F8]"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-[#F1C8C2] bg-[#FBE8E5] p-4 text-sm leading-6 text-[#9E433B]"
            >
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-[#151517] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#34343A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Getting prediction…' : 'Predict severe-injury risk'}
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(initialForm)
                setResult(null)
                setErrorMessage('')
              }}
              disabled={loading}
              className="rounded-xl border border-[#E5DCEC] px-5 py-3 text-sm font-semibold text-[#493456] transition hover:bg-[#F8F5FC] disabled:opacity-60"
            >
              Clear inputs
            </button>

            <span className="text-xs leading-5 text-[#92879F]">
              Your request uses your signed-in FitNect session.
            </span>
          </div>
        </form>
      </section>

      {result && (
        <section
          aria-live="polite"
          className="rounded-3xl border border-[#EEEAF3] bg-white p-5 shadow-[0_8px_28px_rgba(72,46,94,.035)] sm:p-7"
        >
          <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#A08BAF]">
            Model response
          </p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#302442]">
                {result.prediction ||
                  (alertRaised
                    ? 'Severe injury alert'
                    : 'No severe injury alert')}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#92879F]">
                This is the prediction returned by the current model, not a
                medical diagnosis. A low estimate does not rule out injury.
              </p>
            </div>

            <div
              className={`rounded-2xl px-5 py-4 text-center ${
                alertRaised
                  ? 'bg-[#FBE8E5] text-[#A4483F]'
                  : 'bg-[#DDF2E5] text-[#397B58]'
              }`}
            >
              <p className="text-3xl font-bold">
                {Number(result.severe_risk_percent).toFixed(1)}%
              </p>

              <p className="mt-1 text-xs font-semibold">
                Severe-risk probability
              </p>

              <p className="mt-1 text-xs">
                {alertRaised ? 'Alert raised' : 'No alert raised'} · {riskLevel}
              </p>
            </div>
          </div>

          {result.history_available === false && (
            <p className="mt-5 rounded-xl bg-[#F7F3FA] p-3 text-xs leading-5 text-[#786787]">
              No prediction history was returned, so this page is showing this
              assessment only—not a trend over time.
            </p>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {preventionTips.map((tip) => (
          <article
            key={tip.title}
            className="rounded-[22px] border border-[#ECE6F2] bg-white p-5 transition hover:border-[#D8C5E7] hover:shadow-[0_12px_30px_rgba(72,46,94,.05)]"
          >
            <span className="rounded-full bg-[#F1E8F8] px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#795B96]">
              {tip.tag}
            </span>

            <h3 className="mt-4 text-sm font-bold text-[#40304F]">
              {tip.title}
            </h3>

            <p className="mt-2 text-xs leading-5 text-[#92879F]">
              {tip.detail}
            </p>
          </article>
        ))}
      </section>

      <p className="rounded-2xl border border-[#E7DDF4] bg-[#F8F4FD] p-4 text-xs leading-5 text-[#6D5684]">
        This model provides an estimate for a severe-injury alert and is not a
        diagnosis or a substitute for professional care. Stop exercising if
        you experience concerning pain and consult a qualified healthcare
        professional when needed.
      </p>
    </div>
  )
}

export default InjuryRisk
