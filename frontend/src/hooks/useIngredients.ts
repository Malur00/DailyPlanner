import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ingredientsApi } from '../api/ingredients'
import type { IngredientCreate, IngredientUpdate } from '../types/ingredient'

export const INGREDIENTS_KEY = ['ingredients']

export function useIngredients(search = '', month?: number) {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, search, month],
    queryFn: () => ingredientsApi.getAll(search, month),
  })
}

export function useCreateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: IngredientCreate) => ingredientsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGREDIENTS_KEY }),
  })
}

export function useUpdateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IngredientUpdate }) =>
      ingredientsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGREDIENTS_KEY }),
  })
}

export function useDeleteIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ingredientsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGREDIENTS_KEY }),
  })
}

export function useAiLookup() {
  return useMutation({ mutationFn: (name: string) => ingredientsApi.aiLookup(name) })
}
