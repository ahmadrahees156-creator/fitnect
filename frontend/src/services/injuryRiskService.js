import api from './api'

export const predictInjuryRisk = async (payload) => {
  const response = await api.post('/injury-risk/predict', payload)
  return response.data
}

export default { predictInjuryRisk }
