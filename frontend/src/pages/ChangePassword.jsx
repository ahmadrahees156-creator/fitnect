import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changePassword } from '../services/authService'

function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword.length < 8 || form.newPassword.length > 72) {
      setError('New password must be between 8 and 72 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    if (form.currentPassword === form.newPassword) {
      setError('Choose a new password that differs from your current password.')
      return
    }

    setLoading(true)
    try {
      const response = await changePassword(form)
      setSuccess(response.message || 'Your password has been changed.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change your password. If you signed up with Google, use password recovery to set one first.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-4 py-3.5 text-sm outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E4DBF4] px-4 py-10">
      <section className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-xl sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-[#151517]">Fit<span className="text-[#8B73D9]">Nect</span></Link>
          <button type="button" onClick={() => navigate('/profile')} className="rounded-xl border border-[#E5DCEF] px-3 py-2 text-sm font-semibold text-[#62447D] transition hover:bg-[#F8F4FB]">← Profile</button>
        </div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#8059B7]">Account security</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#151517]">Change password</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Use your current password to set a new one. Your new password must be 8–72 characters.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</p>}
        {success && <p role="status" className="mt-5 rounded-xl border border-[#CAECD6] bg-[#F0FBF4] p-3 text-sm leading-6 text-[#245D3A]">{success}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {[
            { name: 'currentPassword', label: 'Current password', autocomplete: 'current-password' },
            { name: 'newPassword', label: 'New password', autocomplete: 'new-password' },
            { name: 'confirmPassword', label: 'Confirm new password', autocomplete: 'new-password' },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-2 block text-sm font-semibold text-[#151517]">{field.label}</label>
              <input id={field.name} name={field.name} type={showPasswords ? 'text' : 'password'} autoComplete={field.autocomplete} minLength={field.name === 'currentPassword' ? undefined : 8} maxLength={72} required value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} className={inputClass} placeholder={field.name === 'currentPassword' ? 'Enter current password' : 'At least 8 characters'} />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} className="h-4 w-4 accent-[#8059B7]" /> Show passwords</label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#FDC381] px-4 py-3.5 text-sm font-bold text-[#151517] transition hover:bg-[#F8B466] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Saving password...' : 'Update password →'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">Forgot your current password? <Link to="/forgot-password" className="font-bold text-[#8059B7] hover:underline">Reset it here</Link></p>
      </section>
    </main>
  )
}

export default ChangePassword
