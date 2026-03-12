import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dishesApi, type DishFilters } from '../api/dishes'
import type { DishCreate, DishUpdate } from '../types/dish'

export const DISHES_KEY = ['dishes']

export function useDishes(filters?: DishFilters) {
  return useQuery({
    queryKey: [...DISHES_KEY, filters],
    queryFn: () => dishesApi.getAll(filters),
  })
}

export function useCreateDish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DishCreate) => dishesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  })
}

export function useUpdateDish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DishUpdate }) => dishesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  })
}

export function useDeleteDish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => dishesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  })
}

export function useAddDishIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dishId, data }: { dishId: number; data: { ingredient_id: number; quantity_g: number } }) =>
      dishesApi.addIngredient(dishId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  })
}

export function useRemoveDishIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dishId, ingredientId }: { dishId: number; ingredientId: number }) =>
      dishesApi.removeIngredient(dishId, ingredientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  })
}
