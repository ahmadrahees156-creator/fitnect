
import api from './api'

export async function addHydrationEntry(data) {
  const response = await api.post('/hydration', data)
  return response.data
}

export async function getTodayHydration() {
  const response = await api.get('/hydration/today')
  return response.data
}

export async function getHydrationHistory(days = 7) {
  const response = await api.get('/hydration/history', {
    params: { days },
  })
  return response.data
}
