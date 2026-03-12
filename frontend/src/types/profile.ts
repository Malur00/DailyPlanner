export type Gender = 'male' | 'female'
export type Goal = 'weight_loss' | 'maintenance' | 'mass'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense'
export type CalcFormula = 'mifflin' | 'harris'
export type WeighDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type BodyStructure = 'ectomorph' | 'mesomorph' | 'endomorph'
export type Slot = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'
export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface Profile {
  id: number
  name: string
  gender: Gender
  age: number
  weight_kg: number
  height_cm: number
  body_fat_pct?: number | null
  goal: Goal
  body_structure?: BodyStructure | null
  activity_level: ActivityLevel
  calc_formula: CalcFormula
  weigh_day?: WeighDay | null
}

export type ProfileCreate = Omit<Profile, 'id'>
export type ProfileUpdate = ProfileCreate

export interface ProfileGoalDist {
  id: number
  profilegoal_id: number
  slot_type: Slot
  macro_carbs_pct: number
  macro_proteins_pct: number
  macro_fats_pct: number
}

export type ProfileGoalDistCreate = Pick<ProfileGoalDist, 'slot_type' | 'macro_carbs_pct' | 'macro_proteins_pct' | 'macro_fats_pct'>

export interface ProfileGoal {
  id: number
  profile_id: number
  meal_dist_breakfast_pct: number
  meal_dist_morning_snack_pct: number
  meal_dist_lunch_pct: number
  meal_dist_afternoon_snack_pct: number
  meal_dist_dinner_pct: number
  macro_carbs_pct: number
  macro_proteins_pct: number
  macro_fats_pct: number
  distributions: ProfileGoalDist[]
  // Computed server-side
  bmr?: number | null
  tdee?: number | null
  kcal_target?: number | null
  carbs_g?: number | null
  proteins_g?: number | null
  fats_g?: number | null
}

export type ProfileGoalCreate = {
  meal_dist_breakfast_pct: number
  meal_dist_morning_snack_pct: number
  meal_dist_lunch_pct: number
  meal_dist_afternoon_snack_pct: number
  meal_dist_dinner_pct: number
  macro_carbs_pct: number
  macro_proteins_pct: number
  macro_fats_pct: number
  distributions: ProfileGoalDistCreate[]
}
