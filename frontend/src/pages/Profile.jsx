
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, updateCurrentUser } from '../services/authService'
import { getMyFitnessProfile, saveMyFitnessProfile } from '../services/fitnessProfileService'

const goalToApi = {
  'Build strength': 'strength',
  'Lose weight': 'weight_management',
  'Improve endurance': 'endurance',
}

const goalFromApi = {
  strength: 'Build strength',
  weight_gain: 'Build strength',
  weight_management: 'Lose weight',
  endurance: 'Improve endurance',
  general_fitness: 'Build strength',
}

const initialProfile = {
  name: '',
  email: '',
  avatar: '',
  role: 'athlete',
  fitnessLevel: 'Beginner',
  goal: 'Build strength',
  age: '',
  height: '',
  weight: '',
  heightCm: '',
  weightKg: '',
  activityLevel: 'moderate',
  experienceLevel: 'beginner',
  workoutLocation: 'gym',
  dietaryPreference: 'vegetarian',
}

function Profile({ onBack }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(initialProfile)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const response = await getCurrentUser()
        const user =
          response.user || response.data?.user || response.data || response

        const savedUser = (() => {
          try {
            return JSON.parse(localStorage.getItem('fitnect_user') || '{}')
          } catch {
            return {}
          }
        })()

        let fitness = {}
        try {
          const fitnessResponse = await getMyFitnessProfile()
          fitness = fitnessResponse.profile || {}
        } catch {
          fitness = {}
        }

        if (active) {
          setProfile({
            ...initialProfile,
            ...savedUser,
            name: user.name || user.fullName || savedUser.name || '',
            email: user.email || savedUser.email || '',
            avatar: user.avatar || savedUser.avatar || '',
            role: user.role || savedUser.role || 'athlete',
            fitnessLevel: savedUser.fitnessLevel || 'Beginner',
            goal: goalFromApi[fitness.goal] || savedUser.goal || 'Build strength',
            age: fitness.age ?? savedUser.age ?? '',
            height: fitness.heightCm ?? savedUser.height ?? '',
            weight: fitness.weightKg ?? savedUser.weight ?? '',
            heightCm: fitness.heightCm ?? '',
            weightKg: fitness.weightKg ?? '',
            activityLevel: fitness.activityLevel || 'moderate',
            experienceLevel: fitness.experienceLevel || 'beginner',
            workoutLocation: fitness.workoutLocation || 'gym',
            dietaryPreference: fitness.dietaryPreference || 'vegetarian',
          })

          localStorage.setItem(
            'fitnect_user',
            JSON.stringify({ ...savedUser, ...user }),
          )
        }
      } catch {
        if (active) {
          try {
            const user = JSON.parse(
              localStorage.getItem('fitnect_user') || '{}',
            )

            if (Object.keys(user).length > 0) {
              setProfile((previous) => ({
                ...previous,
                ...user,
                name: user.name || user.fullName || '',
                email: user.email || '',
                avatar: user.avatar || '',
                role: user.role || 'athlete',
              }))
            } else {
              setMessage('Could not load your profile. Please try again.')
            }
          } catch {
            setMessage('Could not load your saved profile.')
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((previous) => ({ ...previous, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage('')

    const age = Number(profile.age)
    const heightCm = Number(profile.heightCm || profile.height)
    const weightKg = Number(profile.weightKg || profile.weight)

    if (!profile.name.trim() || !age || !heightCm || !weightKg) {
      setMessage('Please enter your name, age, height, and weight before saving.')
      return
    }

    try {
      const userResponse = await updateCurrentUser({ name: profile.name.trim() })
      const updatedUser =
        userResponse.user || userResponse.data?.user || userResponse.data || userResponse

      await saveMyFitnessProfile({
        age,
        heightCm,
        weightKg,
        goal: goalToApi[profile.goal] || 'general_fitness',
        activityLevel: profile.activityLevel || 'moderate',
        experienceLevel: ({ Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'advanced' })[profile.fitnessLevel] || profile.experienceLevel || 'beginner',
        workoutLocation: profile.workoutLocation || 'gym',
        dietaryPreference: profile.dietaryPreference || 'vegetarian',
      })
      const savedUser = JSON.parse(
        localStorage.getItem('fitnect_user') || '{}',
      )

      localStorage.setItem(
        'fitnect_user',
        JSON.stringify({
          ...savedUser,
          ...updatedUser,
          name: updatedUser.name || profile.name.trim(),
          email: updatedUser.email || profile.email,
          fitnessLevel: profile.fitnessLevel,
          goal: profile.goal,
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
        }),
      )

      setEditMode(false)
      setMessage('Profile saved successfully.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save your profile. Complete your fitness onboarding first if this is a new account.')
    }
  }

  const handleCancel = () => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem('fitnect_user') || '{}',
      )

      setProfile((previous) => ({
        ...previous,
        name: savedUser.name || savedUser.fullName || previous.name,
        email: savedUser.email || previous.email,
        fitnessLevel: savedUser.fitnessLevel || 'Beginner',
        goal: savedUser.goal || 'Build strength',
        age: savedUser.age || '',
        height: savedUser.height || '',
        weight: savedUser.weight || '',
      }))
    } catch {
      // Keep the current profile if saved data cannot be read.
    }

    setEditMode(false)
    setMessage('')
  }

  const initials = profile.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'A'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F3E8FF] via-[#F8F6FC] to-[#E0E7FF] text-[#49365E]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-[#7550B8]" />
          <p className="text-sm font-semibold">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#F3E8FF] via-[#F8F6FC] to-[#E0E7FF] px-4 py-4 text-[#302442] sm:px-8 sm:py-6">
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-80 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate('/dashboard'))}
            className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/50 px-4 py-2 text-sm font-semibold text-[#74578E] shadow-sm backdrop-blur transition duration-300 hover:-translate-x-1 hover:bg-white hover:text-[#4F356B]"
          >
            <span aria-hidden="true">←</span>
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/change-password')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FDC381] px-4 py-2 text-sm font-bold text-[#151517] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8B466]"
          >
            Change password <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="mb-5">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#9679AF]">
            Your account
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-1.5 text-sm text-[#81758D] sm:text-base">
            Manage your personal details and fitness preferences.
          </p>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(78,48,112,0.12)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_25px_70px_rgba(78,48,112,0.16)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#29243F] via-[#393052] to-[#59406B] px-6 py-6 text-white sm:px-8 sm:py-7">
            <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[#D7A8F4]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#8B5CF6]/20 blur-3xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-gradient-to-br from-[#B794F6] via-[#8B5CF6] to-[#5B3A91] text-2xl font-extrabold text-white shadow-[0_0_30px_rgba(167,139,250,0.4)] ring-4 ring-white/10 transition duration-300 hover:scale-105 sm:h-24 sm:w-24 sm:text-3xl">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={`${profile.name || 'Your'} profile`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-200">
                  Fitness member
                </p>
                <h2 className="break-words text-xl font-bold sm:text-2xl">
                  {profile.name || 'Athlete'}
                </h2>
                <p className="mt-1 break-all text-sm text-white/70">
                  {profile.email || 'Add your email'}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-purple-100 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {profile.role}
                </div>
              </div>

              {!editMode && (
                <button
                  type="button"
                  onClick={() => {
                    setMessage('')
                    setEditMode(true)
                  }}
                  className="self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#49365E] shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#F3E8FF] hover:shadow-xl sm:self-center"
                >
                  Edit profile <span className="ml-1">↗</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold">Personal information</h3>
                <p className="mt-1 text-sm text-[#91859B]">
                  Your basic account details.
                </p>
              </div>

              {editMode && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F2EAF9] px-3 py-1.5 text-xs font-bold text-[#76538F]">
                  <span className="h-2 w-2 rounded-full bg-[#9872B5]" />
                  Editing mode
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="Your full name"
              />

              <Field
                label="Email address"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={true}
                type="email"
                placeholder="you@example.com"
              />

              <Field
                label="Age"
                name="age"
                value={profile.age}
                onChange={handleChange}
                disabled={!editMode}
                type="number"
                placeholder="Your age"
              />

              <Field
                label="Height (cm)"
                name="height"
                value={profile.height}
                onChange={handleChange}
                disabled={!editMode}
                type="number"
                placeholder="e.g. 175"
              />

              <Field
                label="Weight (kg)"
                name="weight"
                value={profile.weight}
                onChange={handleChange}
                disabled={!editMode}
                type="number"
                placeholder="e.g. 70"
              />

              <div>
                <label
                  htmlFor="fitnessLevel"
                  className="mb-2 block text-sm font-semibold text-[#51435F]"
                >
                  Fitness level
                </label>
                <select
                  id="fitnessLevel"
                  name="fitnessLevel"
                  value={profile.fitnessLevel}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full rounded-xl border border-[#E6DDED] bg-white/80 px-4 py-3 text-sm text-[#302442] shadow-sm outline-none transition duration-200 hover:border-[#C4AFE0] focus:border-[#9872B5] focus:bg-white focus:ring-4 focus:ring-[#9872B5]/15 disabled:cursor-not-allowed disabled:bg-[#F8F5FC] disabled:opacity-100"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#D8C8E8] bg-[#F8F3FC] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B73A8]">Body mass index</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#302442]">
                    {Number(profile.heightCm || profile.height) > 0 && Number(profile.weightKg || profile.weight) > 0
                      ? (Number(profile.weightKg || profile.weight) / ((Number(profile.heightCm || profile.height) / 100) ** 2)).toFixed(1)
                      : '—'}
                  </span>
                  <span className="text-xs font-semibold text-[#81758D]">kg/m²</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#81758D]">Automatically calculated from your saved height and weight.</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[#F0EAF4] pt-5">
              <h3 className="text-lg font-bold">Fitness preferences</h3>
              <p className="mb-4 mt-1 text-sm text-[#91859B]">
                Choose the goal you want to focus on.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: 'Build strength',
                    icon: '💪',
                    description: 'Get stronger every day',
                  },
                  {
                    value: 'Lose weight',
                    icon: '🎯',
                    description: 'Work towards your target',
                  },
                  {
                    value: 'Improve endurance',
                    icon: '🏃',
                    description: 'Build stamina and energy',
                  },
                ].map((item) => {
                  const selected = profile.goal === item.value

                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={!editMode}
                      onClick={() =>
                        setProfile((previous) => ({
                          ...previous,
                          goal: item.value,
                        }))
                      }
                      className={`group rounded-2xl border p-3.5 text-left transition duration-300 ${
                        selected
                          ? 'border-[#9A78B8] bg-gradient-to-br from-[#F5EFFB] to-[#EEE5FA] ring-1 ring-[#9A78B8] shadow-md shadow-purple-900/5'
                          : 'border-[#EAE2F0] bg-white/80 hover:-translate-y-0.5 hover:border-[#B99ADD] hover:bg-[#FCFAFF] hover:shadow-md'
                      } disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl transition duration-300 group-hover:scale-110">
                          {item.icon}
                        </span>
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7550B8] text-xs font-bold text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 text-sm font-bold">{item.value}</p>
                      <p className="mt-1 text-xs leading-5 text-[#91859B]">
                        {item.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {message && (
              <p
                role="status"
                className="mt-5 rounded-xl border border-[#E5D7F4] bg-[#F5EFFB] px-4 py-3 text-sm text-[#62447D]"
              >
                {message}
              </p>
            )}

            {editMode && (
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#F0EAF4] pt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-[#E4D9EC] bg-white px-5 py-3 text-sm font-bold text-[#6D5A7C] transition duration-300 hover:border-[#CBB7DC] hover:bg-[#F8F4FB]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#7550B8] to-[#59406B] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition duration-300 hover:-translate-y-0.5 hover:from-[#6542A5] hover:to-[#493357] hover:shadow-xl active:translate-y-0"
                >
                  Save changes <span className="ml-1">✓</span>
                </button>
              </div>
            )}
          </form>
        </section>

        <p className="mt-4 px-3 text-center text-xs leading-5 text-[#8A7A9B]">
          Your name and fitness preferences are saved to your FitNect account.
          Email address is read-only.
        </p>
      </div>
    </main>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  disabled,
  type = 'text',
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-[#51435F]"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        min={type === 'number' ? '1' : undefined}
        max={type === 'number' && name === 'age' ? '120' : undefined}
        className="w-full rounded-xl border border-[#E6DDED] bg-white/80 px-4 py-3 text-sm text-[#302442] shadow-sm outline-none transition duration-200 placeholder:text-[#B6AABD] hover:border-[#C4AFE0] focus:border-[#9872B5] focus:bg-white focus:ring-4 focus:ring-[#9872B5]/15 disabled:cursor-not-allowed disabled:bg-[#F8F5FC] disabled:text-[#6D5A7C] disabled:opacity-100"
      />
    </div>
  )
}

export default Profile
