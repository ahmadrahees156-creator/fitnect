import api from './api'

export const getTodayRecovery = async () => {
  const response = await api.get('/recovery/today')
  return response.data
}

export const getRecoveryHistory = async (limit = 30) => {
  const response = await api.get('/recovery/history', {
    params: { limit },
  })
  return response.data
}

export const saveRecoveryCheckIn = async (recoveryData) => {
  const response = await api.post('/recovery', recoveryData)
  return response.data
}