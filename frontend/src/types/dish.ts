import type { Ingredient } from './ingredient'
import type { Slot, Day } from './profile'

export type DishType = 'primary' | 'secondary' | 'side'

export interface DishIngredient {
  id: number
  dish_id: number
  ingredient_id: number
  quantity_g: number
  ingredient?: Ingredient
}

export interface Dish {
  id: number
  name: string
  dish_type: DishType
  max_per_week?: number | null
  profile_id?: number | null
  meal_slots: Slot[]
  variable_portions: boolean
  day_preferences?: Day[] | null
  preparation?: string | null
  dish_ingredients: DishIngredient[]
}

export type DishCreate = {
  name: string
  dish_type: DishType
  max_per_week?: number | null
  profile_id?: number | null
  meal_slots: Slot[]
  variable_portions: boolean
  day_preferences?: Day[] | null
  preparation?: string | null
  ingredients: { ingredient_id: number; quantity_g: number }[]
}

export type DishUpdate = Omit<Dish, 'id' | 'dish_ingredients'>
