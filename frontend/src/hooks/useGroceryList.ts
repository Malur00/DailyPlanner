import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groceryListsApi } from '../api/groceryLists'
import type { GroceryItemCreate } from '../types/groceryList'

export const GROCERY_KEY = ['grocery-list']

export function useGroceryList(mealPlanId: number | null) {
  return useQuery({
    queryKey: [...GROCERY_KEY, mealPlanId],
    queryFn: () => groceryListsApi.get(mealPlanId!),
    enabled: mealPlanId !== null,
    retry: false, // Don't retry if 404 (plan may not have a grocery list yet)
  })
}

export function useAddGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mealPlanId, data }: { mealPlanId: number; data: GroceryItemCreate }) =>
      groceryListsApi.addItem(mealPlanId, data),
    onSuccess: (_d, { mealPlanId }) =>
      qc.invalidateQueries({ queryKey: [...GROCERY_KEY, mealPlanId] }),
  })
}

export function useUpdateGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mealPlanId, itemId, data }: { mealPlanId: number; itemId: number; data: GroceryItemCreate }) =>
      groceryListsApi.updateItem(mealPlanId, itemId, data),
    onSuccess: (_d, { mealPlanId }) =>
      qc.invalidateQueries({ queryKey: [...GROCERY_KEY, mealPlanId] }),
  })
}

export function useRemoveGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mealPlanId, itemId }: { mealPlanId: number; itemId: number }) =>
      groceryListsApi.removeItem(mealPlanId, itemId),
    onSuccess: (_d, { mealPlanId }) =>
      qc.invalidateQueries({ queryKey: [...GROCERY_KEY, mealPlanId] }),
  })
}

export function useCheckGroceryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mealPlanId, itemId, checked }: { mealPlanId: number; itemId: number; checked: boolean }) =>
      groceryListsApi.checkItem(mealPlanId, itemId, checked),
    onSuccess: (_d, { mealPlanId }) =>
      qc.invalidateQueries({ queryKey: [...GROCERY_KEY, mealPlanId] }),
  })
}
