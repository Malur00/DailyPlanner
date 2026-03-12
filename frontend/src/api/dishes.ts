import { api } from './client'
import type { Dish, DishCreate, DishUpdate, DishIngredient } from '../types/dish'

const BASE = '/diet/dishes'

export interface DishFilters {
  dish_type?: string
  slot?: string
  profile_id?: number
}

export const dishesApi = {
  getAll: (filters?: DishFilters) =>
    api.get<Dish[]>(BASE, { params: filters }).then(r => r.data),

  create: (data: DishCreate) => api.post<Dish>(BASE, data).then(r => r.data),

  getOne: (id: number) => api.get<Dish>(`${BASE}/${id}`).then(r => r.data),

  update: (id: number, data: DishUpdate) =>
    api.put<Dish>(`${BASE}/${id}`, data).then(r => r.data),

  remove: (id: number) => api.delete(`${BASE}/${id}`),

  addIngredient: (dishId: number, data: { ingredient_id: number; quantity_g: number }) =>
    api.post<DishIngredient>(`${BASE}/${dishId}/ingredients`, data).then(r => r.data),

  removeIngredient: (dishId: number, ingredientId: number) =>
    api.delete(`${BASE}/${dishId}/ingredients/${ingredientId}`),
}
