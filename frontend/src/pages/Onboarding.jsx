import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyFitnessProfile, saveMyFitnessProfile } from '../services/fitnessProfileService'

const initialForm = {
  age: '',
  gender: 'prefer_not_to_say',
  heightCm: '',
  weightKg: '',
  goal: 'general_fitness',
  activityLevel: 'moderate',
  experienceLevel: 'beginner',
  workoutLocation: 'gym',
  dietaryPreference: 'vegetarian',
}

const fields = [
  { name: 'age', label: 'Age', type: 'number', min: 13, max: 120, placeholder: 'Age in years' },
  { name: 'heightCm', label: 'Height (cm)', type: 'number', min: 80, max: 250, placeholder: 'Height in centimetres' },
  { name: 'weightKg', label: 'Weight (kg)', type: 'number', min: 20, max: 500, placeholder: 'Weight in kilograms' },
]

const choices = [
  { name: 'goal', label: 'Fitness goal', options: [['strength', 'Build strength'], ['weight_gain', 'Gain weight'], ['weight_management', 'Weight management'], ['endurance', 'Improve endurance'], ['general_fitness', 'General fitness']] },
  { name: 'activityLevel', label: 'Current activity', options: [['sedentary', 'Mostly sitting'], ['light', 'Light activity'], ['moderate', 'Moderately active'], ['high', 'Highly active']] },
  { name: 'experienceLevel', label: 'Training experience', options: [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']] },
  { name: 'workoutLocation', label: 'Where do you work out?', options: [['home', 'At home'], ['gym', 'At the gym'], ['both', 'Both']] },
  { name: 'dietaryPreference', label: 'Diet preference', options: [['vegetarian', 'Vegetarian'], ['non_vegetarian', 'Non-vegetarian'], ['vegan', 'Vegan'], ['other', 'Other']] },
]

function Onboarding() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getMyFitnessProfile()
      .then((data) => {
        if (!active || !data.profile) return
        setForm((previous) => ({
          ...previous,
          ...data.profile,
          heightCm: data.profile.heightCm ?? '',
          weightKg: data.profile.weightKg ?? '',
        }))
      })
      .catch(() => {
        if (active) setError('Could not load your saved fitness details. You can still complete the form.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      }
      const result = await saveMyFitnessProfile(payload)
      const user = JSON.parse(localStorage.getItem('fitnect_user') || '{}')
      localStorage.setItem('fitnect_user', JSON.stringify({
        ...user,
        onboardingCompleted: result.onboardingCompleted ?? true,
      }))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const missing = err.response?.data?.missingFields
      setError(missing?.length
        ? 'Please complete every field before continuing.'
        : err.response?.data?.message || 'Could not save your fitness profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-3.5 py-3 text-sm text-[#151517] outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]'

  return (
    <main className="min-h-screen bg-[#E4DBF4] px-4 py-8 text-[#151517] sm:px-6">
      <section className="mx-auto max-w-3xl rounded-[28px] bg-white p-5 shadow-xl sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-extrabold">Fit<span className="text-[#8B73D9]">Nect</span></p>
          <span className="rounded-full bg-[#CAECD6] px-3 py-1.5 text-xs font-bold">Step 1 of 1</span>
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#8B73D9]">Personalise your plan</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Tell us about your fitness</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">These details help FitNect personalise wellness insights and training guidance. You can update them later from your profile.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="py-12 text-center text-sm text-gray-500">Loading your details...</p> : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-7">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm font-semibold">Gender
                <select className={inputClass + ' mt-2'} name="gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                  <option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              {fields.map((field) => (
                <label key={field.name} className="block text-sm font-semibold">
                  {field.label}
                  <input className={inputClass + ' mt-2'} name={field.name} type={field.type} min={field.min} max={field.max} value={form[field.name]} placeholder={field.placeholder} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} required />
                </label>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {choices.map((choice) => (
                <label key={choice.name} className="block text-sm font-semibold">
                  {choice.label}
                  <select className={inputClass + ' mt-2'} name={choice.name} value={form[choice.name]} onChange={(e) => setForm({ ...form, [choice.name]: e.target.value })} required>
                    {choice.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-[#EEE7F5] pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-xl border border-[#E5DCEF] px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">Not now</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#FDC381] px-6 py-3 text-sm font-extrabold text-[#151517] transition hover:bg-[#F8B466] disabled:opacity-60">{saving ? 'Saving details...' : 'Save and continue →'}</button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

export default Onboarding
