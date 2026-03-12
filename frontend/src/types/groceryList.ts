import type { Ingredient } from './ingredient'

export interface GroceryItem {
  id: number
  grocery_list_id: number
  ingredient_id: number
  quantity_g: number
  checked: boolean
  ingredient?: Ingredient
}

export interface GroceryList {
  id: number
  meal_plan_id: number
  items: GroceryItem[]
}

export interface GroceryItemCreate {
  ingredient_id: number
  quantity_g: number
}
