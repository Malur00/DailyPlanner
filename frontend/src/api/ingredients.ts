import { api } from './client'
import type { Ingredient, IngredientCreate, IngredientUpdate, AILookupResponse } from '../types/ingredient'

const BASE = '/diet/ingredients'

export const ingredientsApi = {
  getAll: (search = '', month?: number) => {
    const params: Record<string, string | number> = {}
    if (search) params.search = search
    if (month !== undefined) params.month = month
    return api.get<Ingredient[]>(BASE, { params }).then(r => r.data)
  },

  create: (data: IngredientCreate) => api.post<Ingredient>(BASE, data).then(r => r.data),

  update: (id: number, data: IngredientUpdate) =>
    api.put<Ingredient>(`${BASE}/${id}`, data).then(r => r.data),

  remove: (id: number) => api.delete(`${BASE}/${id}`),

  aiLookup: (name: string) =>
    api.post<AILookupResponse>(`${BASE}/ai-lookup`, { name }).then(r => r.data),
}
