import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mealPlansApi } from '../api/mealPlans'
import type { GeneratePlanRequest } from '../types/mealPlan'

export const MEAL_PLANS_KEY = ['meal-plans']

export function useMealPlans(profileId: number | null) {
  return useQuery({
    queryKey: [...MEAL_PLANS_KEY, profileId],
    queryFn: () => mealPlansApi.getAll(profileId!),
    enabled: profileId !== null,
  })
}

export function useGenerateMealPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GeneratePlanRequest) => mealPlansApi.generate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEAL_PLANS_KEY }),
  })
}

export function useDeleteMealPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mealPlansApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEAL_PLANS_KEY }),
  })
}
