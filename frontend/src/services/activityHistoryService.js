
import api from './api'

export async function getActivityHistory(days = 7) {
  const response = await api.get('/activity-history', {
    params: { days },
  })

  return response.data
}
