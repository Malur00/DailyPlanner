export interface Ingredient {
  id: number
  name: string
  unit: string
  kcal_per_100g: number
  proteins_g: number
  carbs_g: number
  fats_g: number
  seasonality_months?: number[] | null
}

export type IngredientCreate = Omit<Ingredient, 'id'>
export type IngredientUpdate = IngredientCreate

export interface AILookupResponse {
  name: string
  kcal_per_100g: number
  proteins_g: number
  carbs_g: number
  fats_g: number
  unit: string
}
