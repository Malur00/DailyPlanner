import type { Slot } from './profile'
import type { Dish } from './dish'

export interface Meal {
  id: number
  daily_plan_id: number
  slot: Slot
  dish_id?: number | null
  kcal?: number | null
  macros_json?: { proteins_g: number; carbs_g: number; fats_g: number } | null
  dish?: Dish | null
}

export interface DailyPlan {
  id: number
  meal_plan_id: number
  date: string // ISO date string
  meals: Meal[]
}

export interface MealPlan {
  id: number
  profile_id: number
  week_start_date: string // ISO date string
  daily_plans: DailyPlan[]
}

export interface MealPlanCreate {
  profile_id: number
  week_start_date: string
}

export interface GeneratePlanRequest {
  profile_id: number
  week_start_date: string
}
