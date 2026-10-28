import api from './api'

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const verifyEmail = async (email, otp) => {
  const response = await api.post('/auth/verify-email', { email, otp })
  return response.data
}

export const resendOtp = async (email) => {
  const response = await api.post('/auth/resend-otp', { email })
  return response.data
}

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/users/me')
  return response.data
}

export const updateCurrentUser = async (userData) => {
  const response = await api.patch('/users/me', userData)
  return response.data
}

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data
}

export const resetPassword = async (payload) => {
  const response = await api.post('/auth/reset-password', payload)
  return response.data
}

export const changePassword = async (payload) => {
  const response = await api.patch('/auth/change-password', payload)
  return response.data
}
