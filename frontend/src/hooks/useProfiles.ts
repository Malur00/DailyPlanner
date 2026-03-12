import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profilesApi } from '../api/profiles'
import type { ProfileCreate, ProfileUpdate, ProfileGoalCreate } from '../types/profile'

export const PROFILES_KEY = ['profiles']

export function useProfiles() {
  return useQuery({ queryKey: PROFILES_KEY, queryFn: profilesApi.getAll })
}

export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfileCreate) => profilesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProfileUpdate }) => profilesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

export function useDeleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => profilesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

export function useProfileGoal(profileId: number | null) {
  return useQuery({
    queryKey: ['profile-goal', profileId],
    queryFn: () => profilesApi.getGoal(profileId!),
    enabled: profileId !== null,
  })
}

export function useUpsertGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProfileGoalCreate }) =>
      profilesApi.upsertGoal(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['profile-goal', id] })
    },
  })
}
