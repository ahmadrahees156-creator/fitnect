import api from './api'

export async function getWorkoutLibrary({ page = 1, limit = 12, category, difficulty, search } = {}) {
  const params = { page, limit }
  if (category && category !== 'all') params.category = category.toLowerCase()
  if (difficulty && difficulty !== 'all') params.difficulty = difficulty.toLowerCase()
  if (search?.trim()) params.search = search.trim()

  const response = await api.get('/workout-library', { params })
  return response.data
}

export async function getWorkoutLibraryDetails(id) {
  const response = await api.get(`/workout-library/${id}`)
  return response.data
}
