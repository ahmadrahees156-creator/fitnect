import api from './api'

export const getMyFitnessProfile = async () => {
  const response = await api.get('/fitness-profile/me')
  return response.data
}

export const saveMyFitnessProfile = async (profile) => {
  const response = await api.put('/fitness-profile/me', profile)
  return response.data
}
