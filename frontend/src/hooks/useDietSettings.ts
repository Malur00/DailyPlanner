import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dietSettingsApi } from '../api/dietSettings'
import type { DietSettingsUpdate } from '../types/dietSettings'

export const DIET_SETTINGS_KEY = ['diet-settings']

export function useDietSettings() {
  return useQuery({
    queryKey: DIET_SETTINGS_KEY,
    queryFn: dietSettingsApi.get,
  })
}

export function useUpdateDietSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DietSettingsUpdate) => dietSettingsApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIET_SETTINGS_KEY }),
  })
}
