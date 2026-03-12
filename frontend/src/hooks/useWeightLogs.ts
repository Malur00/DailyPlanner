import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { weightLogsApi } from '../api/weightLogs'
import type { WeightLogCreate } from '../types/weightLog'

export const WEIGHT_LOGS_KEY = ['weight-logs']

export function useWeightLogs(profileId: number | null, from?: string, to?: string) {
  return useQuery({
    queryKey: [...WEIGHT_LOGS_KEY, profileId, from, to],
    queryFn: () => weightLogsApi.getAll(profileId!, from, to),
    enabled: profileId !== null,
  })
}

export function useCreateWeightLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WeightLogCreate) => weightLogsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: WEIGHT_LOGS_KEY }),
  })
}

export function useDeleteWeightLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => weightLogsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: WEIGHT_LOGS_KEY }),
  })
}
