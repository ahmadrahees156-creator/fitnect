
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'fitnect_coach_profile'

const emptyProfile = {
  name: '',
  email: '',
  specialization: 'Strength & Conditioning',
  experience: '',
  certifications: '',
  bio: '',
  phone: '',
  location: '',
  instagram: '',
}

const specializations = [
  'Strength & Conditioning',
  'Injury Prevention',
  'Endurance Training',
  'Sports Performance',
  'Mobility & Recovery',
  'General Fitness',
]

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#40364D]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#EAE3F0] bg-[#FCFAFE] px-4 py-3 text-sm text-[#302442] outline-none transition placeholder:text-[#B1A7BB] focus:border-[#A17BC8] focus:bg-white focus:ring-4 focus:ring-[#E4DBF4]/60"
      />
    </label>
  )
}

function CoachProfile() {
  const [profile, setProfile] = useState(emptyProfile)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let user = {}

    try {
      user = JSON.parse(localStorage.getItem('fitnect_user') || '{}')
    } catch {
      user = {}
    }

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

      setProfile({
        ...emptyProfile,
        name: user.name || user.fullName || '',
        email: user.email || '',
        ...saved,
        name: saved.name || user.name || user.fullName || '',
        email: user.email || saved.email || '',
      })
    } catch {
      setProfile({
        ...emptyProfile,
        name: user.name || user.fullName || '',
        email: user.email || '',
      })
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  const handleSave = (event) => {
    event.preventDefault()

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      setEditing(false)
      setMessage('Your coach profile has been saved on this device.')
    } catch {
      setMessage('Unable to save the profile. Check your browser storage.')
    }
  }

  const initials =
    profile.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'C'

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#A17BC8]">
            Your professional identity
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#151517]">
            Coach Profile
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#7E7E82]">
            Tell your athletes who you are, what you specialise in, and how
            you help them train with confidence.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setMessage('')
            }}
            className="rounded-2xl bg-[#151517] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#63477F]"
          >
            Edit profile <span className="ml-2">↗</span>
          </button>
        )}
      </div>

      <section className="relative overflow-hidden rounded-[30px] border border-[#EAE3F0] bg-white shadow-[0_20px_60px_rgba(70,48,90,0.07)]">
        <div className="relative overflow-hidden bg-[#E4DBF4] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-[#F373D4]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-[#FDC381]/60 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border-4 border-white/80 bg-[#151517] text-2xl font-black text-white shadow-lg transition duration-300 hover:rotate-3 hover:scale-105">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#63477F]">
                <span className="h-2 w-2 rounded-full bg-[#5BAA7C]" />
                FitNect Coach
              </span>
              <h3 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-[#151517] sm:text-3xl">
                {profile.name || 'Your name here'}
              </h3>
              <p className="mt-1 text-sm text-[#635777]">
                {profile.specialization || 'Add your specialization'}
              </p>
              <p className="mt-1 break-all text-xs text-[#796B89]">
                {profile.email || 'Add your account email'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/65 p-4 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#806B95]">
                Experience
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#302442]">
                {profile.experience ? `${profile.experience} yrs` : '—'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#151517]">
                Professional details
              </h3>
              <p className="mt-1 text-sm text-[#7E7E82]">
                Keep your information clear and up to date.
              </p>
            </div>
            {editing && (
              <span className="rounded-full bg-[#FCEBD5] px-3 py-1.5 text-[10px] font-bold text-[#8D5B1D]">
                EDITING
              </span>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="name" value={profile.name} onChange={handleChange} placeholder="Your full name" />
            <Field label="Email address" name="email" value={profile.email} onChange={handleChange} placeholder="you@example.com" type="email" />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#40364D]">
                Specialization
              </span>
              <select
                name="specialization"
                value={profile.specialization}
                onChange={handleChange}
                disabled={!editing}
                className="w-full rounded-2xl border border-[#EAE3F0] bg-[#FCFAFE] px-4 py-3 text-sm outline-none transition focus:border-[#A17BC8] focus:ring-4 focus:ring-[#E4DBF4]/60 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {specializations.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <Field
              label="Years of experience"
              name="experience"
              value={profile.experience}
              onChange={handleChange}
              placeholder="e.g. 5"
              type="number"
            />
            <Field label="Certifications" name="certifications" value={profile.certifications} onChange={handleChange} placeholder="e.g. CPT, CSCS" />
            <Field label="Phone number" name="phone" value={profile.phone} onChange={handleChange} placeholder="Your contact number" type="tel" />
            <Field label="City / Location" name="location" value={profile.location} onChange={handleChange} placeholder="e.g. New Delhi" />
            <Field label="Instagram (optional)" name="instagram" value={profile.instagram} onChange={handleChange} placeholder="@yourhandle" />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-[#40364D]">
              About you
            </span>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={4}
              maxLength={600}
              placeholder="Share your coaching approach, experience, and what motivates you..."
              className="w-full resize-y rounded-2xl border border-[#EAE3F0] bg-[#FCFAFE] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#B1A7BB] focus:border-[#A17BC8] focus:bg-white focus:ring-4 focus:ring-[#E4DBF4]/60"
            />
            <span className="mt-1 block text-right text-xs text-[#A09AA8]">
              {profile.bio.length}/600
            </span>
          </label>

          {!editing && (
            <div className="mt-5 rounded-2xl bg-[#F8F5FC] p-4 text-sm leading-6 text-[#7E718A]">
              Select <strong>Edit profile</strong> to update your details.
            </div>
          )}

          {message && (
            <p role="status" className="mt-5 rounded-2xl border border-[#CFE9D8] bg-[#EFF9F2] px-4 py-3 text-sm text-[#286B45]">
              {message}
            </p>
          )}

          {editing && (
            <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-[#F0EAF4] pt-5">
              <button
                type="button"
                onClick={() => {
                  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
                  const user = JSON.parse(localStorage.getItem('fitnect_user') || '{}')
                  setProfile({
                    ...emptyProfile,
                    name: user.name || user.fullName || '',
                    email: user.email || '',
                    ...saved,
                  })
                  setEditing(false)
                  setMessage('')
                }}
                className="rounded-2xl border border-[#E5DDED] px-5 py-3 text-sm font-bold text-[#71647D] transition hover:bg-[#F8F5FC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-[#151517] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#151517]/10 transition hover:-translate-y-0.5 hover:bg-[#63477F]"
              >
                Save profile <span className="ml-2">✓</span>
              </button>
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-[#A09AA8]">
            Profile changes are currently stored in this browser only. They
            are not yet synced to your account or visible to other users.
          </p>
        </form>
      </section>
    </div>
  )
}

export default CoachProfile
