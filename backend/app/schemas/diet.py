from datetime import date as _date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

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
    name:           str   = Field(...,  description="Display name of the profile")
    gender:         Literal["male", "female"] = Field(..., description="Biological gender — affects BMR formula")
    age:            int   = Field(...,  gt=0, description="Age in years")
    weight_kg:      float = Field(...,  gt=0, description="Current body weight in kg")
    height_cm:      float = Field(...,  gt=0, description="Height in cm")
    body_fat_pct:   Optional[float] = Field(None, ge=0, le=100, description="Body fat percentage (optional)")
    goal:           Literal["weight_loss", "maintenance", "mass"] = Field(..., description="Dietary goal — adjusts Kcal target: weight_loss=−500 kcal, maintenance=0, mass=+300 kcal")
    body_structure: Optional[Literal["ectomorph", "mesomorph", "endomorph"]] = Field(None, description="Body type (informational)")
    activity_level: Literal["sedentary", "light", "moderate", "intense", "very_intense"] = Field(..., description="Physical activity level — used as TDEE multiplier (1.2 → 1.9)")
    calc_formula:   Literal["mifflin", "harris"] = Field("mifflin", description="BMR formula: mifflin = Mifflin-St Jeor, harris = Harris-Benedict")
    weigh_day:      Optional[DAYS] = Field(None, description="Preferred weekly weigh-in day")


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
    slot_type:          SLOTS = Field(..., description="Meal slot this distribution applies to")
    macro_carbs_pct:    float = Field(..., ge=0, le=100, description="Carbohydrates % for this slot — must sum to 100 with proteins + fats")
    macro_proteins_pct: float = Field(..., ge=0, le=100, description="Proteins % for this slot")
    macro_fats_pct:     float = Field(..., ge=0, le=100, description="Fats % for this slot")

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
    meal_dist_breakfast_pct:       float = Field(15.0, ge=0, le=100, description="% of daily Kcal assigned to breakfast")
    meal_dist_morning_snack_pct:   float = Field(10.0, ge=0, le=100, description="% of daily Kcal assigned to morning snack")
    meal_dist_lunch_pct:           float = Field(40.0, ge=0, le=100, description="% of daily Kcal assigned to lunch")
    meal_dist_afternoon_snack_pct: float = Field(5.0,  ge=0, le=100, description="% of daily Kcal assigned to afternoon snack")
    meal_dist_dinner_pct:          float = Field(30.0, ge=0, le=100, description="% of daily Kcal assigned to dinner — all 5 meal fields must sum to 100")
    macro_carbs_pct:               float = Field(50.0, ge=0, le=100, description="Overall daily carbohydrates %")
    macro_proteins_pct:            float = Field(20.0, ge=0, le=100, description="Overall daily proteins %")
    macro_fats_pct:                float = Field(30.0, ge=0, le=100, description="Overall daily fats % — carbs + proteins + fats must sum to 100")
    distributions:                 list[ProfileGoalDistCreate] = Field([], description="Per-slot macro splits (one entry per meal slot)")

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
    name:               str           = Field(..., description="Ingredient name (e.g. 'Chicken breast')")
    unit:               str           = Field("g", description="Unit of measure — default: g (grams)")
    kcal_per_100g:      float         = Field(..., ge=0, description="Calories per 100 g/ml")
    proteins_g:         float         = Field(..., ge=0, description="Proteins in grams per 100 g/ml")
    carbs_g:            float         = Field(..., ge=0, description="Carbohydrates in grams per 100 g/ml")
    fats_g:             float         = Field(..., ge=0, description="Fats in grams per 100 g/ml")
    seasonality_months: Optional[list[int]] = Field(None, description="Months (1–12) when the ingredient is available. null = available all year")


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(IngredientBase):
    pass


class IngredientResponse(IngredientBase):
    id: int

    class Config:
        from_attributes = True


class AILookupRequest(BaseModel):
    name: str = Field(..., description="Ingredient name to look up via Claude AI")


class AILookupResponse(BaseModel):
    name:               str   = Field(..., description="Ingredient name as interpreted by AI")
    kcal_per_100g:      float = Field(..., description="Estimated Kcal per 100 g")
    proteins_g:         float = Field(..., description="Estimated proteins per 100 g")
    carbs_g:            float = Field(..., description="Estimated carbohydrates per 100 g")
    fats_g:             float = Field(..., description="Estimated fats per 100 g")
    unit:               str   = Field("g", description="Unit of measure returned by AI")


# ---------------------------------------------------------------------------
# Dish
# ---------------------------------------------------------------------------

class DishIngredientBase(BaseModel):
    ingredient_id: int   = Field(..., description="FK to Ingredient")
    quantity_g:    float = Field(..., gt=0, description="Quantity of this ingredient in grams")


class DishIngredientCreate(DishIngredientBase):
    pass


class DishIngredientResponse(DishIngredientBase):
    id:         int
    dish_id:    int
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True


class DishBase(BaseModel):
    name:              str            = Field(..., description="Dish name (e.g. 'Grilled Chicken')")
    dish_type:         Literal["primary", "secondary", "side"] = Field(..., description="primary = main course selected by the generator; secondary = macro corrector added alongside primary; side = condiment/extra")
    max_per_week:      Optional[int]  = Field(None, ge=1, description="Maximum times this dish may appear in a weekly plan (null = unlimited)")
    profile_id:        Optional[int]  = Field(None, description="Profile FK — null means the dish is available to all profiles (global)")
    meal_slots:        list[SLOTS]    = Field(..., description="Meal slots this dish can be assigned to (e.g. ['lunch', 'dinner'])")
    variable_portions: bool           = Field(False, description="If True the generator rebalances ingredient quantities to hit macro targets; if False it rebalances the overall dish portion size keeping ingredient ratios fixed")
    day_preferences:   Optional[list[DAYS]] = Field(None, description="Preferred days of the week for this dish (null = any day)")
    preparation:       Optional[str]  = Field(None, description="Free-text preparation notes / recipe")


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
    slot:        SLOTS           = Field(..., description="Meal slot: breakfast | morning_snack | lunch | afternoon_snack | dinner")
    dish_id:     Optional[int]   = Field(None, description="FK to Dish — null when the slot is left empty")
    kcal:        Optional[float] = Field(None, description="Computed kilocalories for this meal (set by the generator)")
    macros_json: Optional[dict]  = Field(None, description="Computed macronutrients JSON: {proteins_g, carbs_g, fats_g} (set by the generator)")


class MealResponse(MealBase):
    id:           int
    daily_plan_id: int
    dish:         Optional[DishResponse] = None

    class Config:
        from_attributes = True


class DailyPlanResponse(BaseModel):
    id:          int
    meal_plan_id: int
    date:        _date
    meals:       list[MealResponse] = []

    class Config:
        from_attributes = True


class MealPlanResponse(BaseModel):
    id:              int
    profile_id:      int
    week_start_date: _date
    daily_plans:     list[DailyPlanResponse] = []

    class Config:
        from_attributes = True


class MealPlanCreate(BaseModel):
    profile_id:      int  = Field(..., description="FK to Profile — owner of this meal plan")
    week_start_date: _date = Field(..., description="Monday of the target week (ISO 8601 date, e.g. 2025-06-02)")


class GeneratePlanRequest(BaseModel):
    profile_id:      int  = Field(..., description="Profile to use for the automatic plan generation")
    week_start_date: _date = Field(..., description="Monday of the target week (ISO 8601 date) — a new MealPlan is created for that week")


# ---------------------------------------------------------------------------
# Weight Log
# ---------------------------------------------------------------------------

class WeightLogCreate(BaseModel):
    profile_id:   int            = Field(..., description="FK to Profile")
    date:         _date          = Field(..., description="Date of the weigh-in (ISO 8601, e.g. 2025-06-02)")
    weight_kg:    float          = Field(..., gt=0, description="Measured body weight in kg")
    body_fat_pct: Optional[float] = Field(None, ge=0, le=100, description="Measured body fat percentage (optional)")


class WeightLogResponse(WeightLogCreate):
    id: int

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Grocery List
# ---------------------------------------------------------------------------

class GroceryItemCreate(BaseModel):
    ingredient_id: int   = Field(..., description="FK to Ingredient")
    quantity_g:    float = Field(..., gt=0, description="Total quantity needed in grams")


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
    checked: bool = Field(..., description="New checked/unchecked state for the grocery item")
