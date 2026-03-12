import { api } from './client'
import type { MealPlan, MealPlanCreate, GeneratePlanRequest } from '../types/mealPlan'

const BASE = '/diet/meal-plans'

export const mealPlansApi = {
  getAll: (profileId: number) =>
    api.get<MealPlan[]>(BASE, { params: { profile_id: profileId } }).then(r => r.data),

  create: (data: MealPlanCreate) => api.post<MealPlan>(BASE, data).then(r => r.data),

  getOne: (id: number) => api.get<MealPlan>(`${BASE}/${id}`).then(r => r.data),

  remove: (id: number) => api.delete(`${BASE}/${id}`),

  generate: (data: GeneratePlanRequest) =>
    api.post<MealPlan>(`${BASE}/generate`, data).then(r => r.data),
}
