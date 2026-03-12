import { api } from './client'
import type { GroceryList, GroceryItem, GroceryItemCreate } from '../types/groceryList'

const BASE = '/diet/grocery-lists'

export const groceryListsApi = {
  get: (mealPlanId: number) =>
    api.get<GroceryList>(`${BASE}/${mealPlanId}`).then(r => r.data),

  addItem: (mealPlanId: number, data: GroceryItemCreate) =>
    api.post<GroceryItem>(`${BASE}/${mealPlanId}/items`, data).then(r => r.data),

  updateItem: (mealPlanId: number, itemId: number, data: GroceryItemCreate) =>
    api.put<GroceryItem>(`${BASE}/${mealPlanId}/items/${itemId}`, data).then(r => r.data),

  removeItem: (mealPlanId: number, itemId: number) =>
    api.delete(`${BASE}/${mealPlanId}/items/${itemId}`),

  checkItem: (mealPlanId: number, itemId: number, checked: boolean) =>
    api.patch<GroceryItem>(`${BASE}/${mealPlanId}/items/${itemId}/check`, { checked }).then(r => r.data),
}
