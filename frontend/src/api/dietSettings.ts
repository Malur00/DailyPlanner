import { api } from './client'
import type { DietSettings, DietSettingsUpdate } from '../types/dietSettings'

export const dietSettingsApi = {
  get: (): Promise<DietSettings> =>
    api.get('/diet/settings').then(r => r.data),

  update: (data: DietSettingsUpdate): Promise<DietSettings> =>
    api.put('/diet/settings', data).then(r => r.data),
}
