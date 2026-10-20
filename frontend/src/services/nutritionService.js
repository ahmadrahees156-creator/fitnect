import api from './api'

export async function getTodayNutrition() {
  const response = await api.get('/nutrition/today')
  return response.data
}

export async function getNutritionHistory(days = 7) {
  const response = await api.get('/nutrition/history', {
    params: { days },
  })
  return response.data
}

export async function addNutritionEntry(data) {
  const response = await api.post('/nutrition', data)
  return response.data
}

export async function getNutritionGoals() {
  const response = await api.get('/nutrition-goals')
  return response.data
}

export async function saveNutritionGoals(goals) {
  const response = await api.put('/nutrition-goals', goals)
  return response.data
}

export async function getNutritionGoalsProgress() {
  const response = await api.get('/nutrition-goals/progress/today')
  return response.data
}