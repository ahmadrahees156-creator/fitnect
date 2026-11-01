import api from './api'

export async function predictPhotoInjury(image) {
  const formData = new FormData()
  formData.append('image', image)
  // Axios/browser supplies the multipart boundary; api interceptor adds the access token.
  const response = await api.post('/image-analysis/predict', formData)
  return response.data
}
