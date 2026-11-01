import api from './api'

export async function predictPhotoInjury(image) {
  const formData = new FormData()
  formData.append('image', image)
  const response = await api.post('/image-analysis/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
