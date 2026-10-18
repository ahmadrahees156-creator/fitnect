
import { useEffect, useState } from 'react'

const initialFactors = {
  trainingLoad: 'Balanced',
  sleep: '7–9 hours',
  soreness: 'Mild',
  recovery: 'Good',
}

const factorOptions = [
  {
    key: 'trainingLoad',
    label: 'Training load',
    options: ['Light', 'Balanced', 'Heavy'],
    icon: '↗',
    color: 'bg-[#FCE8D1] text-[#A86B32]',
  },
  {
    key: 'sleep',
    label: 'Sleep last night',
    options: ['Under 5 hours', '5–7 hours', '7–9 hours'],
    icon: '☾',
    color: 'bg-[#E9DFF8] text-[#7956A0]',
  },
  {
    key: 'soreness',
    label: 'Muscle soreness',
    options: ['None', 'Mild', 'Moderate', 'Severe'],
    icon: '♡',
    color: 'bg-[#F9DFF0] text-[#A34D85]',
  },
  {
    key: 'recovery',
    label: 'Recovery feeling',
    options: ['Poor', 'Okay', 'Good'],
    icon: '↻',
    color: 'bg-[#DDF2E5] text-[#438263]',
  },
]

const preventionTips = [
  {
    title: 'Warm up properly',
    detail:
      'Start sessions with 5–10 minutes of easy movement and dynamic mobility.',
    tag: 'BEFORE TRAINING',
    icon: '↗',
  },
  {
    title: 'Increase load gradually',
    detail:
      'Avoid sudden jumps in workout duration, intensity or weekly frequency.',
    tag: 'TRAINING HABIT',
    icon: '⌁',
  },
  {
    title: 'Make recovery count',
    detail:
      'Prioritize sleep, hydration, rest days and lighter sessions when needed.',
    tag: 'DAILY RECOVERY',
    icon: '☾',
  },
]

function getRisk(factors) {
  let score = 0

  if (factors.trainingLoad === 'Heavy') score += 2
  if (factors.trainingLoad === 'Light') score -= 1

  if (factors.sleep === 'Under 5 hours') score += 2
  if (factors.sleep === '5–7 hours') score += 1

  if (factors.soreness === 'Moderate') score += 1
  if (factors.soreness === 'Severe') score += 3

  if (factors.recovery === 'Poor') score += 2
  if (factors.recovery === 'Okay') score += 1

  if (score >= 4) {
    return {
      label: 'More caution',
      level: 'Elevated indicators',
      description:
        'Several selected inputs suggest taking a more conservative approach to your next session.',
      color: '#B85B50',
      background: '#FBE8E5',
      score,
    }
  }

  if (score >= 2) {
    return {
      label: 'Take it steady',
      level: 'Some indicators to watch',
      description:
        'Consider adjusting training intensity and paying attention to how your body feels.',
      color: '#A87531',
      background: '#FBEEDB',
      score,
    }
  }

  return {
    label: 'Keep your balance',
    level: 'Fewer warning indicators',
    description:
      'Your selected inputs show fewer common warning indicators. Continue sensible training and recovery habits.',
    color: '#438263',
    background: '#DDF2E5',
    score,
  }
}

function getRecommendations(factors) {
  const recommendations = []

  if (factors.trainingLoad === 'Heavy') {
    recommendations.push({
      title: 'Adjust training intensity',
      detail:
        'Consider a lighter session if your recent workload feels unusually demanding.',
      tag: 'TRAINING LOAD',
    })
  }

  if (factors.sleep === 'Under 5 hours') {
    recommendations.push({
      title: 'Prioritize rest',
      detail:
        'Consider reducing intensity today and aim for adequate sleep tonight.',
      tag: 'SLEEP',
    })
  } else if (factors.sleep === '5–7 hours') {
    recommendations.push({
      title: 'Protect your sleep routine',
      detail:
        'Allow enough time for sleep and notice how rested you feel before training.',
      tag: 'SLEEP',
    })
  }

  if (
    factors.soreness === 'Moderate' ||
    factors.soreness === 'Severe'
  ) {
    recommendations.push({
      title: 'Pay attention to soreness',
      detail:
        'Avoid pushing through significant pain. Rest and seek professional advice if symptoms persist or concern you.',
      tag: 'SORENESS',
    })
  }

  if (factors.recovery === 'Poor') {
    recommendations.push({
      title: 'Choose recovery first',
      detail:
        'Consider gentle movement or rest instead of a demanding workout.',
      tag: 'RECOVERY',
    })
  }

  if (factors.recovery === 'Okay') {
    recommendations.push({
      title: 'Check how you feel',
      detail:
        'Start conservatively and reassess your energy and comfort before increasing intensity.',
      tag: 'RECOVERY',
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Keep your routine balanced',
      detail:
        'Continue warming up, increasing workload gradually and making time for recovery.',
      tag: 'DAILY HABITS',
    })
  }

  return recommendations
}

function readSavedValue(key, fallback, validate) {
  try {
    const saved = localStorage.getItem(key)

    if (!saved) return fallback

    const parsed = JSON.parse(saved)

    return validate(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function InjuryRisk() {
  const [factors, setFactors] = useState(() =>
    readSavedValue(
      'fitnect-injury-factors',
      initialFactors,
      (saved) =>
        saved &&
        typeof saved === 'object' &&
        !Array.isArray(saved) &&
        Object.entries(initialFactors).every(([key, value]) =>
          factorOptions
            .find((factor) => factor.key === key)
            .options.includes(saved[key] ?? value),
        ),
    ),
  )

  const [checkedTips, setCheckedTips] = useState(() =>
    readSavedValue(
      'fitnect-injury-tips',
      [],
      (saved) =>
        Array.isArray(saved) &&
        saved.every((title) =>
          preventionTips.some((tip) => tip.title === title),
        ),
    ),
  )

  useEffect(() => {
    try {
      localStorage.setItem(
        'fitnect-injury-factors',
        JSON.stringify(factors),
      )
    } catch {
      // Storage may be unavailable in some browser contexts.
    }
  }, [factors])

  useEffect(() => {
    try {
      localStorage.setItem(
        'fitnect-injury-tips',
        JSON.stringify(checkedTips),
      )
    } catch {
      // Storage may be unavailable in some browser contexts.
    }
  }, [checkedTips])

  const risk = getRisk(factors)
  const recommendations = getRecommendations(factors)

  const updateFactor = (key, value) => {
    setFactors((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const toggleTip = (title) => {
    setCheckedTips((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    )
  }

  return (
    <div className="fitnect-enter space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#302442] via-[#473451] to-[#69466B] p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#F7BBD9]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-[#FDC381]/15 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.7px] text-[#F7D1E9]">
              Train with awareness
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-1px] sm:text-4xl">
              Listen to your body.
              <br />
              <span className="text-[#FDC381]">
                Move with confidence.
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-[#E0D5E8]">
              Review common training and recovery indicators before your next
              workout and build safer habits over time.
            </p>
          </div>

          <div
            className="flex min-w-[175px] flex-col items-center justify-center rounded-[24px] border border-white/15 bg-white/[.08] p-6 text-center"
            aria-live="polite"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
              style={{
                backgroundColor: risk.background,
                color: risk.color,
              }}
            >
              {risk.score >= 4 ? '!' : risk.score >= 2 ? '↗' : '✓'}
            </div>

            <p className="mt-4 text-lg font-bold">{risk.label}</p>
            <p className="mt-1 text-xs text-[#D7C9DF]">
              {risk.level}
            </p>

            <span className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[10px] text-[#E6D9EB]">
              Demo indicator
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#A08BAF]">
            Personal check
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-[-.7px] text-[#302442] sm:text-2xl">
            How are you feeling today?
          </h2>

          <p className="mt-2 text-sm text-[#92879F]">
            Adjust these inputs to see how your demo indicators change.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {factorOptions.map((factor) => (
            <article
              key={factor.key}
              className="rounded-[22px] border border-[#ECE6F2] bg-white p-5 transition duration-200 hover:border-[#D8C5E7] hover:shadow-[0_12px_30px_rgba(72,46,94,.05)]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${factor.color}`}
                >
                  {factor.icon}
                </span>

                <h3 className="text-sm font-bold text-[#40304F]">
                  {factor.label}
                </h3>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {factor.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={factors[factor.key] === option}
                    onClick={() => updateFactor(factor.key, option)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      factors[factor.key] === option
                        ? 'border-[#B99ACF] bg-[#F1E8F8] text-[#684786]'
                        : 'border-[#EEE8F3] bg-[#FCFAFD] text-[#8D8098] hover:border-[#DCC9E9]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#A08BAF]">
            Your current inputs
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#302442]">
            What to pay attention to
          </h2>

          <div className="mt-5 space-y-4">
            {factorOptions.map((factor) => {
              const value = factors[factor.key]

              const needsAttention =
                value === 'Heavy' ||
                value === 'Under 5 hours' ||
                value === 'Moderate' ||
                value === 'Severe' ||
                value === 'Poor' ||
                value === '5–7 hours' ||
                value === 'Okay'

              return (
                <div
                  key={factor.key}
                  className="flex items-center justify-between gap-3 border-b border-[#F1EBF5] pb-4 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-[#82758E]">
                    {factor.label}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      needsAttention
                        ? 'bg-[#FBEEDB] text-[#A87531]'
                        : 'bg-[#DDF2E5] text-[#438263]'
                    }`}
                  >
                    {value}
                  </span>
                </div>
              )
            })}
          </div>

          <div
            className="mt-6 rounded-2xl p-4"
            style={{ backgroundColor: risk.background }}
          >
            <p
              className="text-sm font-bold"
              style={{ color: risk.color }}
            >
              Suggested approach
            </p>

            <p className="mt-2 text-sm leading-6 text-[#6F627A]">
              {risk.description}
            </p>
          </div>
        </article>

        <article className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#A08BAF]">
            Prevention habits
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#302442]">
            Small habits, better training
          </h2>

          <p className="mt-2 text-sm text-[#92879F]">
            Mark the habits you plan to follow today.
          </p>

          <div className="mt-5 space-y-3">
            {preventionTips.map((tip) => {
              const checked = checkedTips.includes(tip.title)

              return (
                <button
                  key={tip.title}
                  type="button"
                  onClick={() => toggleTip(tip.title)}
                  aria-pressed={checked}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    checked
                      ? 'border-[#C7E7D4] bg-[#F0F8F3]'
                      : 'border-[#EEE8F3] bg-[#FCFAFD] hover:border-[#DDCBE9]'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
                      checked
                        ? 'bg-[#CDEBD8] text-[#397B58]'
                        : 'bg-[#EEE5F7] text-[#795B96]'
                    }`}
                  >
                    {checked ? '✓' : tip.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-[#40304F]">
                      {tip.title}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-[#92879F]">
                      {tip.detail}
                    </span>

                    <span className="mt-2 block text-[9px] font-bold tracking-[1.2px] text-[#A38EB1]">
                      {tip.tag}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-[#8B7D96]">
            {checkedTips.length} of {preventionTips.length} habits selected
          </p>
        </article>
      </section>

      <section className="rounded-[24px] border border-[#ECE6F2] bg-white p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#A08BAF]">
          Based on your selections
        </p>

        <h2 className="mt-2 text-xl font-bold text-[#302442]">
          Your suggested next steps
        </h2>

        <p className="mt-2 text-sm text-[#92879F]">
          These suggestions update when you change your inputs.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recommendations.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#EEE8F3] bg-[#FCFAFD] p-4 transition hover:border-[#DCC9E9]"
            >
              <span className="rounded-full bg-[#F1E8F8] px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#795B96]">
                {item.tag}
              </span>

              <h3 className="mt-3 text-sm font-bold text-[#40304F]">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#92879F]">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <p className="rounded-2xl border border-[#E9DFF0] bg-[#F2EBF8] p-4 text-xs leading-5 text-[#786787]">
        This page uses illustrative rules, not a clinically validated risk
        prediction model. It cannot diagnose or rule out an injury. Stop
        exercising if you experience concerning pain and consult a qualified
        healthcare professional when needed.
      </p>
    </div>
  )
}

export default InjuryRisk
