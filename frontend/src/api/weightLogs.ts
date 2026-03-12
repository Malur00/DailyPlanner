import { api } from './client'
import type { WeightLog, WeightLogCreate } from '../types/weightLog'

const BASE = '/diet/weight-logs'

export const weightLogsApi = {
  getAll: (profileId: number, from?: string, to?: string) => {
    const params: Record<string, string | number> = { profile_id: profileId }
    if (from) params.from = from
    if (to) params.to = to
    return api.get<WeightLog[]>(BASE, { params }).then(r => r.data)
  },

  create: (data: WeightLogCreate) => api.post<WeightLog>(BASE, data).then(r => r.data),

  remove: (id: number) => api.delete(`${BASE}/${id}`),
}
