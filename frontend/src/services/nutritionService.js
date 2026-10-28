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

export async function searchNutritionFoods(search) {
  const response = await api.get('/nutrition-api/foods', {
    params: { search },
  })
  return response.data
}

export async function getFoodNutrition(fdcId) {
  const response = await api.get('/nutrition-api/nutrition', {
    params: { fdc_id: fdcId },
  })
  return response.data
}

export async function getMealSummary(items) {
  const response = await api.post('/nutrition-api/meal-summary', { items })
  return response.data
}

export async function getPersonalNutritionTargets() {
  const response = await api.post('/nutrition-api/nutrition-targets')
  return response.data
}
