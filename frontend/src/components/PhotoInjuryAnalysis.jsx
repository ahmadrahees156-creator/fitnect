import { useEffect, useState } from 'react'
import { predictPhotoInjury } from '../services/imageAnalysisService'

const MAX_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

function getErrorMessage(error) {
  const status = error?.response?.status
  const serverMessage = error?.response?.data?.message || error?.response?.data?.error
  if (status === 400) return serverMessage || 'Invalid image. Upload a JPG, JPEG, or PNG photo of a foot or lower limb.'
  if (status === 401) return 'Your session may have expired. Please sign in again.'
  if (status === 413) return 'Image is too large. Maximum allowed size is 8 MB.'
  if (status === 503) return 'Photo analysis is temporarily unavailable. Please try again later.'
  if (!error?.response) return 'Unable to connect to FitNect. Check your connection and try again.'
  return serverMessage || 'Photo analysis failed. Please try again.'
}

export default function PhotoInjuryAnalysis() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!image) { setPreview(''); return undefined }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const handleImageChange = (event) => {
    const selected = event.target.files?.[0] || null
    setResult(null)
    setErrorMessage('')
    if (!selected) { setImage(null); return }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setImage(null)
      setErrorMessage('Only JPG, JPEG, and PNG images are supported.')
      event.target.value = ''
      return
    }
    if (selected.size > MAX_SIZE) {
      setImage(null)
      setErrorMessage('Image must be 8 MB or smaller.')
      event.target.value = ''
      return
    }
    setImage(selected)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!image) { setErrorMessage('Please select an image first.'); return }
    setLoading(true)
    setErrorMessage('')
    setResult(null)
    try {
      const response = await predictPhotoInjury(image)
      const data = response?.data ?? response
      if (data?.success !== true) throw new Error('Unexpected analysis response')
      setResult(data)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fitnect-enter space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#E8DDF0] bg-[#E4DBF4] p-6 text-[#151517] shadow-[0_16px_45px_rgba(72,46,94,.07)] sm:p-9 lg:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#F373D4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-[#FDC381]/30 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex rounded-full border border-[#D7C6E8] bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.7px] text-[#72529A]">Photo assessment</span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-1px] text-[#151517] sm:text-4xl">Photo Injury Analysis</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#68616F]">Upload a clear photo of a foot or lower limb to receive an image-based classification and care suggestions.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#EEEAF3] bg-white p-5 shadow-[0_8px_28px_rgba(72,46,94,.035)] sm:p-7">
        <h3 className="text-xl font-bold text-[#302442]">Upload an injury photo</h3>
        <p className="mt-2 text-sm leading-6 text-[#7E7E82]">Supported areas: feet and lower limbs only. Arm images are not supported yet.</p>
        <p className="mt-1 text-xs text-[#92879F]">JPG, JPEG or PNG · Maximum file size 8 MB</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block rounded-2xl border-2 border-dashed border-[#DCCFE9] bg-[#FCFAFE] p-5 transition hover:border-[#A98BC5] hover:bg-[#F8F5FC]">
            <span className="block text-sm font-semibold text-[#493456]">Choose image</span>
            <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handleImageChange} disabled={loading} className="mt-4 block w-full text-sm text-[#68616D] file:mr-4 file:rounded-lg file:border-0 file:bg-[#E4DBF4] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#493456]" />
          </label>
          {preview && <div className="flex flex-col gap-3 sm:flex-row sm:items-start"><img src={preview} alt="Selected injury preview" className="max-h-64 w-full rounded-2xl border border-[#EEEAF3] object-contain sm:max-w-xs" /><div className="text-sm text-[#68676D]"><p className="font-semibold text-[#302442]">{image.name}</p><p className="mt-1">{(image.size / 1048576).toFixed(2)} MB</p></div></div>}
          {errorMessage && <div role="alert" className="rounded-2xl border border-[#F1C8C2] bg-[#FBE8E5] p-4 text-sm leading-6 text-[#9E433B]">{errorMessage}</div>}
          <button type="submit" disabled={loading || !image} className="inline-flex items-center justify-center rounded-xl bg-[#151517] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#34343A] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Analyzing image…' : 'Analyze photo'}</button>
          {loading && <p role="status" className="text-sm text-[#7E7E82]">Your photo is being processed. Please wait…</p>}
        </form>
      </section>

      {result && <section aria-live="polite" className="space-y-5 rounded-3xl border border-[#EEEAF3] bg-white p-5 shadow-[0_8px_28px_rgba(72,46,94,.035)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-2xl font-bold text-[#302442]">Injury Prediction</h3><p className="mt-2 text-lg font-semibold text-[#72529A]">{result.prediction || 'Not available'}</p>{(result.body_part || result.visible_description) && <p className="mt-1 text-sm text-[#7E7E82]">{[result.body_part, result.visible_description].filter(Boolean).join(' · ')}</p>}</div>
          <div className="rounded-2xl bg-[#E4DBF4] px-5 py-4 text-center"><p className="text-3xl font-bold text-[#302442]">{typeof result.confidence === 'number' ? result.confidence.toFixed(1) + '%' : result.confidence ?? '—'}</p><p className="mt-1 text-xs font-semibold text-[#72529A]">Confidence Score</p></div>
        </div>
        <div className="rounded-2xl bg-[#F8F5FC] p-5"><h4 className="font-bold text-[#302442]">Image Analysis</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#68676D]">{result.gemini_explanation || 'No explanation was provided.'}</p></div>
        <div className="rounded-2xl border border-[#D2EBDD] bg-[#F0F9F3] p-5"><h4 className="font-bold text-[#244D34]">Care Recommendations</h4>{Array.isArray(result.care_suggestions) && result.care_suggestions.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#397A52]">{result.care_suggestions.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-[#587361]">No care suggestions were provided.</p>}</div>
        {result.disclaimer && <p className="rounded-2xl border border-[#E7DDF4] bg-[#F8F4FD] p-4 text-xs leading-5 text-[#6D5684]"><strong>Medical Disclaimer: </strong>{result.disclaimer}</p>}
      </section>}
    </div>
  )
}
