import { api } from './client'
import type { Profile, ProfileCreate, ProfileUpdate, ProfileGoal, ProfileGoalCreate } from '../types/profile'

const BASE = '/diet/profiles'

export const profilesApi = {
  getAll: () => api.get<Profile[]>(BASE).then(r => r.data),

  create: (data: ProfileCreate) => api.post<Profile>(BASE, data).then(r => r.data),

  getOne: (id: number) => api.get<Profile>(`${BASE}/${id}`).then(r => r.data),

  update: (id: number, data: ProfileUpdate) =>
    api.put<Profile>(`${BASE}/${id}`, data).then(r => r.data),

  remove: (id: number) => api.delete(`${BASE}/${id}`),

  getGoal: (id: number) => api.get<ProfileGoal>(`${BASE}/${id}/goal`).then(r => r.data),

  upsertGoal: (id: number, data: ProfileGoalCreate) =>
    api.put<ProfileGoal>(`${BASE}/${id}/goal`, data).then(r => r.data),
}
