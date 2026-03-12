export interface WeightLog {
  id: number
  profile_id: number
  date: string // ISO date string
  weight_kg: number
  body_fat_pct?: number | null
}

export type WeightLogCreate = Omit<WeightLog, 'id'>
