import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authService'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is missing its token. Request a new password reset email.')
      return
    }
    if (form.newPassword.length < 8 || form.newPassword.length > 72) {
      setError('Password must be between 8 and 72 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, newPassword: form.newPassword, confirmPassword: form.confirmPassword })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link may have expired. Request a new one and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E4DBF4] px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl sm:p-9">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-[#151517]">Fit<span className="text-[#8B73D9]">Nect</span></Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#8059B7]">Secure your account</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#151517]">Set a new password</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Choose a password that is at least 8 characters long.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success ? (
          <div className="mt-6 rounded-2xl border border-[#CAECD6] bg-[#F0FBF4] p-5">
            <p className="font-bold text-[#245D3A]">Password updated successfully.</p>
            <p className="mt-2 text-sm leading-6 text-[#356B49]">You can now log in using your new password.</p>
            <button type="button" onClick={() => navigate('/login', { replace: true })} className="mt-4 w-full rounded-xl bg-[#FDC381] px-4 py-3 text-sm font-bold text-[#151517] transition hover:bg-[#F8B466]">Go to login →</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold text-[#151517]">New password</label>
              <input id="newPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} placeholder="At least 8 characters" className="w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-4 py-3.5 text-sm outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[#151517]">Confirm new password</label>
              <input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Re-enter your password" className="w-full rounded-xl border border-[#E5DCEF] bg-[#FBF9FE] px-4 py-3.5 text-sm outline-none transition focus:border-[#A58AD2] focus:ring-2 focus:ring-[#E4DBF4]" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-[#8059B7]" /> Show passwords</label>
            <button type="submit" disabled={loading || !token} className="w-full rounded-xl bg-[#FDC381] px-4 py-3.5 text-sm font-bold text-[#151517] transition hover:bg-[#F8B466] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Updating password...' : 'Reset password →'}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gray-600"><Link to="/forgot-password" className="font-bold text-[#8059B7] hover:underline">Request another reset link</Link></p>
      </section>
    </main>
  )
}

export default ResetPassword
