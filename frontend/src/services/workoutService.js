
import api from './api'

export async function getWorkouts({
  page = 1,
  limit = 10,
  category,
} = {}) {
  const params = { page, limit }

  if (
    category &&
    category.toLowerCase() !== 'all'
  ) {
    params.category = category.toLowerCase()
  }

  const response = await api.get('/workouts', { params })
  return response.data
}

export async function getWorkoutById(id) {
  const response = await api.get(`/workouts/${id}`)
  return response.data
}

export async function createWorkout(workoutData) {
  const response = await api.post('/workouts', workoutData)
  return response.data
}

export async function updateWorkout(id, workoutData) {
  const response = await api.patch(`/workouts/${id}`, workoutData)
  return response.data
}

export async function deleteWorkout(id) {
  const response = await api.delete(`/workouts/${id}`)
  return response.data
}

export async function getWorkoutStats(period = 'week') {
  const response = await api.get('/workouts/stats', {
    params: { period },
  })

  return response.data
}
