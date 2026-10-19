
import api from './api'

export const getTodayWellness = async () => {
  const response = await api.get('/wellness/today')
  return response.data
}

export const getWellnessHistory = async (limit = 30) => {
  const response = await api.get('/wellness/history', {
    params: { limit },
  })

  return response.data
}

export const saveWellnessCheckIn = async (wellnessData) => {
  const response = await api.post('/wellness', wellnessData)
  return response.data
}
