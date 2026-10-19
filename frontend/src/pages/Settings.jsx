
import { useState } from 'react'

const defaultSettings = {
  workoutReminders: true,
  recoveryReminders: true,
  wellnessReminders: false,
  hydrationReminders: true,
  profileVisibility: false,
  dataPersonalization: true,
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fitnect_settings')

      return saved
        ? { ...defaultSettings, ...JSON.parse(saved) }
        : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const [savedMessage, setSavedMessage] = useState(false)

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }))
    setSavedMessage(false)
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('fitnect_settings', JSON.stringify(settings))
      setSavedMessage(true)
    } catch {
      setSavedMessage(false)
    }
  }

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-[#F373D4]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )

  const SettingRow = ({ title, description, settingKey }) => (
    <div className="flex items-center justify-between gap-4 border-b border-[#EDE7F4] py-5 last:border-0">
      <div>
        <h3 className="font-semibold text-[#302442]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#7E7E82]">
          {description}
        </p>
      </div>

      <Toggle
        checked={settings[settingKey]}
        onChange={(value) => updateSetting(settingKey, value)}
      />
    </div>
  )

  const enabledReminders = [
    settings.workoutReminders,
    settings.recoveryReminders,
    settings.wellnessReminders,
    settings.hydrationReminders,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#F8F6FC] px-4 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#D879A9]">
            YOUR PREFERENCES
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#302442] sm:text-4xl">
            Settings
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#7E7E82] sm:text-base">
            Personalize your FitNect experience and manage your wellness
            preferences in one place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#302442]">
                  Reminders
                </h2>

                <p className="mt-1 text-sm text-[#7E7E82]">
                  Choose which wellness activities you want reminders for.
                </p>
              </div>

              <SettingRow
                title="Workout reminders"
                description="Stay consistent with your training routine."
                settingKey="workoutReminders"
              />

              <SettingRow
                title="Recovery reminders"
                description="Remember rest days and recovery activities."
                settingKey="recoveryReminders"
              />

              <SettingRow
                title="Daily wellness check-in"
                description="Remember to record your daily wellness."
                settingKey="wellnessReminders"
              />

              <SettingRow
                title="Hydration reminders"
                description="Build a consistent hydration habit."
                settingKey="hydrationReminders"
              />
            </section>

            <section className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#302442]">
                  Privacy & Personalization
                </h2>

                <p className="mt-1 text-sm text-[#7E7E82]">
                  Manage your experience preferences.
                </p>
              </div>

              <SettingRow
                title="Profile visibility preference"
                description="Save your preference for profile visibility."
                settingKey="profileVisibility"
              />

              <SettingRow
                title="Personalized insights"
                description="Allow your preferences to guide personalized content."
                settingKey="dataPersonalization"
              />

              <div className="mt-4 rounded-2xl bg-[#F8F3FC] p-4">
                <p className="text-xs leading-5 text-[#7E7E82]">
                  These options are stored in this browser. The profile
                  visibility preference does not change server permissions,
                  and personalized insights will only affect recommendations
                  once connected to the relevant application logic.
                </p>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={saveSettings}
                className="rounded-xl bg-[#302442] px-6 py-3 font-semibold text-white transition hover:bg-[#48345E] active:scale-[0.98]"
              >
                Save preferences
              </button>

              {savedMessage && (
                <p
                  role="status"
                  className="text-sm font-medium text-green-700"
                >
                  Preferences saved successfully!
                </p>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-[#E4DBF4] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 text-[#302442]"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l2.4 5.1L20 9l-4 4 .9 5.7L12 16l-4.9 2.7L8 13l-4-4 5.6-.9L12 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-[#302442]">
              Your FitNect, your way.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#62566F]">
              Build healthy routines with preferences that match your
              training, recovery and everyday wellness goals.
            </p>

            <div className="mt-6 rounded-2xl bg-white/75 p-4">
              <p className="text-xs font-medium text-[#7E7E82]">
                REMINDERS ENABLED
              </p>

              <p className="mt-1 text-2xl font-bold text-[#302442]">
                {enabledReminders}{' '}
                <span className="text-sm font-medium">of 4</span>
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDE7F4]">
                <div
                  className="h-full rounded-full bg-[#F373D4] transition-all"
                  style={{
                    width: `${(enabledReminders / 4) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/75 p-4">
              <p className="text-xs font-medium text-[#7E7E82]">
                PERSONALIZATION
              </p>

              <p className="mt-1 font-bold text-[#302442]">
                {settings.dataPersonalization ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
