from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, field_validator, model_validator

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SLOTS = Literal["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
DAYS  = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _must_sum_100(values: dict, fields: list[str]) -> None:
    total = sum(values.get(f, 0) for f in fields)
    if round(total, 2) != 100.0:
        raise ValueError(f"{fields} must sum to 100, got {total}")


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class ProfileBase(BaseModel):
    name:           str
    gender:         Literal["male", "female"]
    age:            int
    weight_kg:      float
    height_cm:      float
    body_fat_pct:   Optional[float] = None
    goal:           Literal["weight_loss", "maintenance", "mass"]
    body_structure: Optional[Literal["ectomorph", "mesomorph", "endomorph"]] = None
    activity_level: Literal["sedentary", "light", "moderate", "intense", "very_intense"]
    calc_formula:   Literal["mifflin", "harris"] = "mifflin"
    weigh_day:      Optional[DAYS] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# ProfileGoalDist
# ---------------------------------------------------------------------------

class ProfileGoalDistBase(BaseModel):
    slot_type:          SLOTS
    macro_carbs_pct:    float
    macro_proteins_pct: float
    macro_fats_pct:     float

    @model_validator(mode="after")
    def check_macros_sum(self):
        _must_sum_100(
            self.__dict__,
            ["macro_carbs_pct", "macro_proteins_pct", "macro_fats_pct"]
        )
        return self


class ProfileGoalDistCreate(ProfileGoalDistBase):
    pass


class ProfileGoalDistResponse(ProfileGoalDistBase):
    id: int
    profilegoal_id: int

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# ProfileGoal
# ---------------------------------------------------------------------------

class ProfileGoalBase(BaseModel):
    meal_dist_breakfast_pct:       float = 15.0
    meal_dist_morning_snack_pct:   float = 10.0
    meal_dist_lunch_pct:           float = 40.0
    meal_dist_afternoon_snack_pct: float = 5.0
    meal_dist_dinner_pct:          float = 30.0
    macro_carbs_pct:               float = 50.0
    macro_proteins_pct:            float = 20.0
    macro_fats_pct:                float = 30.0
    distributions:                 list[ProfileGoalDistCreate] = []

    @model_validator(mode="after")
    def check_sums(self):
        _must_sum_100(self.__dict__, [
            "meal_dist_breakfast_pct", "meal_dist_morning_snack_pct",
            "meal_dist_lunch_pct", "meal_dist_afternoon_snack_pct",
            "meal_dist_dinner_pct",
        ])
        _must_sum_100(self.__dict__, [
            "macro_carbs_pct", "macro_proteins_pct", "macro_fats_pct"
        ])
        return self


class ProfileGoalCreate(ProfileGoalBase):
    pass


class ProfileGoalResponse(ProfileGoalBase):
    id:            int
    profile_id:    int
    distributions: list[ProfileGoalDistResponse] = []
    # Computed fields
    bmr:           Optional[float] = None
    tdee:          Optional[float] = None
    kcal_target:   Optional[float] = None
    carbs_g:       Optional[float] = None
    proteins_g:    Optional[float] = None
    fats_g:        Optional[float] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Ingredient
# ---------------------------------------------------------------------------

class IngredientBase(BaseModel):
    name:               str
    unit:               str = "g"
    kcal_per_100g:      float
    proteins_g:         float
    carbs_g:            float
    fats_g:             float
    seasonality_months: Optional[list[int]] = None


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(IngredientBase):
    pass


class IngredientResponse(IngredientBase):
    id: int

    class Config:
        from_attributes = True


class AILookupRequest(BaseModel):
    name: str


class AILookupResponse(BaseModel):
    name:               str
    kcal_per_100g:      float
    proteins_g:         float
    carbs_g:            float
    fats_g:             float
    unit:               str = "g"


# ---------------------------------------------------------------------------
# Dish
# ---------------------------------------------------------------------------

class DishIngredientBase(BaseModel):
    ingredient_id: int
    quantity_g:    float


class DishIngredientCreate(DishIngredientBase):
    pass


class DishIngredientResponse(DishIngredientBase):
    id:         int
    dish_id:    int
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True


class DishBase(BaseModel):
    name:              str
    dish_type:         Literal["primary", "secondary", "side"]
    max_per_week:      Optional[int] = None
    profile_id:        Optional[int] = None
    meal_slots:        list[SLOTS]
    variable_portions: bool = False
    day_preferences:   Optional[list[DAYS]] = None
    preparation:       Optional[str] = None


class DishCreate(DishBase):
    ingredients: list[DishIngredientCreate] = []


class DishUpdate(DishBase):
    pass


class DishResponse(DishBase):
    id:          int
    dish_ingredients: list[DishIngredientResponse] = []

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Meal Plan
# ---------------------------------------------------------------------------

class MealBase(BaseModel):
    slot:        SLOTS
    dish_id:     Optional[int] = None
    kcal:        Optional[float] = None
    macros_json: Optional[dict]  = None


class MealResponse(MealBase):
    id:           int
    daily_plan_id: int
    dish:         Optional[DishResponse] = None

    class Config:
        from_attributes = True


class DailyPlanResponse(BaseModel):
    id:          int
    meal_plan_id: int
    date:        date
    meals:       list[MealResponse] = []

    class Config:
        from_attributes = True


class MealPlanResponse(BaseModel):
    id:              int
    profile_id:      int
    week_start_date: date
    daily_plans:     list[DailyPlanResponse] = []

    class Config:
        from_attributes = True


class MealPlanCreate(BaseModel):
    profile_id:      int
    week_start_date: date


class GeneratePlanRequest(BaseModel):
    profile_id:      int
    week_start_date: date


# ---------------------------------------------------------------------------
# Weight Log
# ---------------------------------------------------------------------------

class WeightLogCreate(BaseModel):
    profile_id:   int
    date:         date
    weight_kg:    float
    body_fat_pct: Optional[float] = None


class WeightLogResponse(WeightLogCreate):
    id: int

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Grocery List
# ---------------------------------------------------------------------------

class GroceryItemCreate(BaseModel):
    ingredient_id: int
    quantity_g:    float


class GroceryItemResponse(GroceryItemCreate):
    id:              int
    grocery_list_id: int
    checked:         bool
    ingredient:      Optional[IngredientResponse] = None

    class Config:
        from_attributes = True


class GroceryListResponse(BaseModel):
    id:          int
    meal_plan_id: int
    items:       list[GroceryItemResponse] = []

    class Config:
        from_attributes = True


class GroceryItemCheckUpdate(BaseModel):
    checked: bool
