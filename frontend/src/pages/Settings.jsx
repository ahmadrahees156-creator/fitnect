import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'fitnect_settings'

const defaultSettings = {
  workoutReminders: true,
  recoveryReminders: true,
  wellnessReminders: false,
  hydrationReminders: true,
  profileVisibility: false,
  dataPersonalization: true,
}

const reminderOptions = [
  {
    key: 'workoutReminders',
    title: 'Workout reminders',
    description: 'Keep a steady rhythm with your training routine.',
    icon: 'activity',
  },
  {
    key: 'recoveryReminders',
    title: 'Recovery reminders',
    description: 'Make room for rest, mobility, and recovery days.',
    icon: 'heart-pulse',
  },
  {
    key: 'wellnessReminders',
    title: 'Daily wellness check-in',
    description: 'Get a nudge to log how you are feeling.',
    icon: 'clipboard-check',
  },
  {
    key: 'hydrationReminders',
    title: 'Hydration reminders',
    description: 'Build a consistent water-intake habit.',
    icon: 'droplets',
  },
]

function readSavedSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F373D4] focus-visible:ring-offset-2 ${
        checked ? 'bg-[#F373D4]' : 'bg-[#D8D5DE]'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B75B9C]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-lg font-bold text-[#302442] sm:text-xl">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#7E7E82]">
          {description}
        </p>
      )}
    </div>
  )
}

function SettingsRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#F0EBF5] py-5 last:border-0">
      <div className="min-w-0">
        <h3 className="font-semibold text-[#302442]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#7E7E82]">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(readSavedSettings)
  const [savedSettings, setSavedSettings] = useState(readSavedSettings)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const hasChanges = Object.keys(defaultSettings).some(
    (key) => settings[key] !== savedSettings[key]
  )

  const enabledReminders = reminderOptions.filter(
    ({ key }) => settings[key]
  ).length

  useEffect(() => {
    if (!feedback.message) return undefined
    const timeout = window.setTimeout(() => {
      setFeedback({ type: '', message: '' })
    }, 3500)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setFeedback({ type: '', message: '' })
  }

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      setSavedSettings({ ...settings })
      setFeedback({
        type: 'success',
        message: 'Your preferences have been saved on this device.',
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not save preferences. Check your browser storage settings.',
      })
    }
  }

  const resetSettings = () => {
    setSettings({ ...defaultSettings })
    setFeedback({
      type: 'info',
      message: 'Defaults loaded. Save preferences to keep these changes.',
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-[#EDE7F4] bg-white p-6 shadow-sm sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#F373D4]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-1/4 h-40 w-40 rounded-full bg-[#E4DBF4]/80 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#B75B9C]">
              YOUR PREFERENCES
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#151517] sm:text-4xl">
              Settings
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#7E7E82] sm:text-base">
              Make FitNect feel right for you. Manage your reminders, privacy
              preferences, and the way your wellness experience is personalized.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4DBF4] text-[#302442]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" />
            </svg>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#F8F3FC] px-3 py-1.5 text-xs font-semibold text-[#62566F]">
            {enabledReminders} of {reminderOptions.length} reminders enabled
          </span>
          {hasChanges && (
            <span className="rounded-full bg-[#FFF2DE] px-3 py-1.5 text-xs font-semibold text-[#8B5420]">
              Unsaved changes
            </span>
          )}
        </div>
      </header>

      {feedback.message && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : feedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-[#E4DBF4] bg-[#F8F3FC] text-[#62566F]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="rounded-3xl border border-[#EDE7F4] bg-white p-5 shadow-sm sm:p-7">
        <SectionHeading
          eyebrow="Account protection"
          title="Account & security"
          description="Manage your password and keep your account secure."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#F0EBF5] p-4 sm:p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4DBF4] text-[#302442]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-[#302442]">Change password</h3>
            <p className="mt-1 text-sm leading-6 text-[#7E7E82]">
              Update your password while you are signed in.
            </p>
            <button
              type="button"
              onClick={() => navigate('/change-password')}
              className="mt-4 rounded-xl bg-[#302442] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#48345E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F373D4] focus-visible:ring-offset-2"
            >
              Change password
            </button>
          </div>
          <div className="rounded-2xl border border-[#F0EBF5] p-4 sm:p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCE5F6] text-[#9E367F]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7.5h17v11h-17z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8 6 8-6M8 4.5h8" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-[#302442]">Forgot password?</h3>
            <p className="mt-1 text-sm leading-6 text-[#7E7E82]">
              Request a password-reset link through your registered email.
            </p>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="mt-4 rounded-xl border border-[#E4DBF4] bg-white px-4 py-2.5 text-sm font-semibold text-[#62566F] transition hover:bg-[#F8F5FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F373D4] focus-visible:ring-offset-2"
            >
              Reset via email
            </button>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#EDE7F4] bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Stay consistent"
              title="Reminders"
              description="Choose the activities you would like FitNect to remind you about."
            />
            {reminderOptions.map(({ key, title, description }) => (
              <SettingsRow
                key={key}
                title={title}
                description={description}
                checked={settings[key]}
                onChange={(value) => updateSetting(key, value)}
              />
            ))}
            <p className="mt-4 rounded-2xl bg-[#F8F5FC] p-4 text-xs leading-5 text-[#7E7E82]">
              These switches save your reminder preferences in this browser.
              They do not send push notifications yet; notification delivery
              needs to be connected separately.
            </p>
          </section>

          <section className="rounded-3xl border border-[#EDE7F4] bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Your information"
              title="Privacy & personalization"
              description="Set your preferences for visibility and personalized content."
            />
            <SettingsRow
              title="Profile visibility preference"
              description="Keep your preference for profile visibility on this device."
              checked={settings.profileVisibility}
              onChange={(value) => updateSetting('profileVisibility', value)}
            />
            <SettingsRow
              title="Personalized insights"
              description="Allow your preferences to guide personalized wellness content."
              checked={settings.dataPersonalization}
              onChange={(value) => updateSetting('dataPersonalization', value)}
            />
            <p className="mt-4 rounded-2xl bg-[#F8F5FC] p-4 text-xs leading-5 text-[#7E7E82]">
              These are local preferences only. Profile visibility does not
              change server permissions, and personalized insights will respond
              to this switch only after the recommendation logic is connected.
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveSettings}
              disabled={!hasChanges}
              className="rounded-xl bg-[#302442] px-6 py-3 font-semibold text-white transition hover:bg-[#48345E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F373D4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={resetSettings}
              disabled={!hasChanges && Object.keys(defaultSettings).every((key) => settings[key] === defaultSettings[key])}
              className="rounded-xl border border-[#E4DBF4] bg-white px-5 py-3 font-semibold text-[#62566F] transition hover:bg-[#F8F5FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F373D4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Restore defaults
            </button>
            <p className="text-xs text-[#8B8A90]">Changes apply after you save.</p>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-3xl bg-[#E4DBF4] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#302442]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3.5Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#302442]">Your FitNect, your way.</h2>
            <p className="mt-3 text-sm leading-6 text-[#62566F]">
              Small, consistent habits add up. Choose reminders that support
              your training, recovery, and everyday wellness.
            </p>
            <div className="mt-6 rounded-2xl bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7E7E82]">
                  Reminders enabled
                </p>
                <p className="font-bold text-[#302442]">{enabledReminders}/{reminderOptions.length}</p>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDE7F4]"
                role="progressbar"
                aria-label="Enabled reminders"
                aria-valuemin={0}
                aria-valuemax={reminderOptions.length}
                aria-valuenow={enabledReminders}
              >
                <div
                  className="h-full rounded-full bg-[#F373D4] transition-all duration-300"
                  style={{ width: `${(enabledReminders / reminderOptions.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7E7E82]">
                Personalized insights
              </p>
              <p className="mt-1 font-bold text-[#302442]">
                {settings.dataPersonalization ? 'Preference enabled' : 'Preference disabled'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#EDE7F4] bg-white p-5">
            <h3 className="font-bold text-[#302442]">Before you leave</h3>
            <p className="mt-2 text-sm leading-6 text-[#7E7E82]">
              Remember to save your changes. Preferences are currently stored
              in this browser and may not follow you to another device.
            </p>
            {hasChanges && (
              <button
                type="button"
                onClick={saveSettings}
                className="mt-4 w-full rounded-xl bg-[#FDC381] px-4 py-3 font-semibold text-[#302442] transition hover:bg-[#F8B76C]"
              >
                Save changes
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
