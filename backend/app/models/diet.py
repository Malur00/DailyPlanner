from sqlalchemy import (
    Boolean, Column, Date, Enum, Float, ForeignKey,
    Integer, JSON, String, Text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from app.database import Base

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

GenderEnum         = Enum("male", "female",                              name="gender_enum")
GoalEnum           = Enum("weight_loss", "maintenance", "mass",          name="goal_enum")
BodyStructureEnum  = Enum("ectomorph", "mesomorph", "endomorph",         name="body_structure_enum")
ActivityLevelEnum  = Enum("sedentary", "light", "moderate",
                          "intense", "very_intense",                     name="activity_level_enum")
CalcFormulaEnum    = Enum("mifflin", "harris",                           name="calc_formula_enum")
WeighDayEnum       = Enum("mon", "tue", "wed", "thu", "fri", "sat", "sun", name="weigh_day_enum")
SlotTypeEnum       = Enum("breakfast", "morning_snack", "lunch",
                          "afternoon_snack", "dinner",                   name="slot_type_enum")
DishTypeEnum       = Enum("primary", "secondary", "side",                name="dish_type_enum")


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class Profile(Base):
    __tablename__ = "profiles"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=False)
    gender         = Column(GenderEnum, nullable=False)
    age            = Column(Integer, nullable=False)
    weight_kg      = Column(Float, nullable=False)
    height_cm      = Column(Float, nullable=False)
    body_fat_pct   = Column(Float, nullable=True)
    goal           = Column(GoalEnum, nullable=False)
    body_structure = Column(BodyStructureEnum, nullable=True)
    activity_level = Column(ActivityLevelEnum, nullable=False)
    calc_formula   = Column(CalcFormulaEnum, nullable=False, default="mifflin")
    weigh_day      = Column(WeighDayEnum, nullable=True)

    goal_config    = relationship("ProfileGoal", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    weight_logs    = relationship("WeightLog",   back_populates="profile", cascade="all, delete-orphan")
    dishes         = relationship("Dish",        back_populates="profile")
    meal_plans     = relationship("MealPlan",    back_populates="profile", cascade="all, delete-orphan")


class ProfileGoal(Base):
    __tablename__ = "profile_goals"

    id                           = Column(Integer, primary_key=True, index=True)
    profile_id                   = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), unique=True)
    meal_dist_breakfast_pct      = Column(Float, nullable=False, default=15.0)
    meal_dist_morning_snack_pct  = Column(Float, nullable=False, default=10.0)
    meal_dist_lunch_pct          = Column(Float, nullable=False, default=40.0)
    meal_dist_afternoon_snack_pct= Column(Float, nullable=False, default=5.0)
    meal_dist_dinner_pct         = Column(Float, nullable=False, default=30.0)
    macro_carbs_pct              = Column(Float, nullable=False, default=50.0)
    macro_proteins_pct           = Column(Float, nullable=False, default=20.0)
    macro_fats_pct               = Column(Float, nullable=False, default=30.0)

    profile       = relationship("Profile",         back_populates="goal_config")
    distributions = relationship("ProfileGoalDist", back_populates="goal", cascade="all, delete-orphan")


class ProfileGoalDist(Base):
    """Per-slot macro distribution — each slot has its own carbs/prot/fats split."""
    __tablename__ = "profile_goal_dists"

    id                 = Column(Integer, primary_key=True, index=True)
    profilegoal_id     = Column(Integer, ForeignKey("profile_goals.id", ondelete="CASCADE"))
    slot_type          = Column(SlotTypeEnum, nullable=False)
    macro_carbs_pct    = Column(Float, nullable=False)
    macro_proteins_pct = Column(Float, nullable=False)
    macro_fats_pct     = Column(Float, nullable=False)

    goal = relationship("ProfileGoal", back_populates="distributions")


# ---------------------------------------------------------------------------
# Ingredient
# ---------------------------------------------------------------------------

class Ingredient(Base):
    __tablename__ = "ingredients"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False, index=True)
    unit             = Column(String, nullable=False, default="g")
    kcal_per_100g    = Column(Float, nullable=False)
    proteins_g       = Column(Float, nullable=False)
    carbs_g          = Column(Float, nullable=False)
    fats_g           = Column(Float, nullable=False)
    seasonality_months = Column(ARRAY(Integer), nullable=True)  # e.g. [1,2,3,10,11,12]

    dish_ingredients = relationship("DishIngredient", back_populates="ingredient")
    grocery_items    = relationship("GroceryItem",    back_populates="ingredient")


# ---------------------------------------------------------------------------
# Dish
# ---------------------------------------------------------------------------

class Dish(Base):
    __tablename__ = "dishes"

    id                 = Column(Integer, primary_key=True, index=True)
    name               = Column(String, nullable=False)
    dish_type          = Column(DishTypeEnum, nullable=False)
    max_per_week       = Column(Integer, nullable=True)
    profile_id         = Column(Integer, ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    meal_slots         = Column(ARRAY(String), nullable=False)  # ["breakfast","lunch",...]
    variable_portions  = Column(Boolean, nullable=False, default=False)
    day_preferences    = Column(ARRAY(String), nullable=True)   # ["mon","wed","fri",...]
    preparation        = Column(Text, nullable=True)

    profile          = relationship("Profile",        back_populates="dishes")
    dish_ingredients = relationship("DishIngredient", back_populates="dish", cascade="all, delete-orphan")
    meals            = relationship("Meal",           back_populates="dish")


class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    id            = Column(Integer, primary_key=True, index=True)
    dish_id       = Column(Integer, ForeignKey("dishes.id",       ondelete="CASCADE"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id",  ondelete="CASCADE"))
    quantity_g    = Column(Float, nullable=False)

    dish       = relationship("Dish",       back_populates="dish_ingredients")
    ingredient = relationship("Ingredient", back_populates="dish_ingredients")


# ---------------------------------------------------------------------------
# Meal Plan
# ---------------------------------------------------------------------------

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id              = Column(Integer, primary_key=True, index=True)
    profile_id      = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"))
    week_start_date = Column(Date, nullable=False)

    profile     = relationship("Profile",   back_populates="meal_plans")
    daily_plans = relationship("DailyPlan", back_populates="meal_plan", cascade="all, delete-orphan")
    grocery_list= relationship("GroceryList", back_populates="meal_plan", uselist=False, cascade="all, delete-orphan")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id          = Column(Integer, primary_key=True, index=True)
    meal_plan_id= Column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"))
    date        = Column(Date, nullable=False)

    meal_plan = relationship("MealPlan", back_populates="daily_plans")
    meals     = relationship("Meal",     back_populates="daily_plan", cascade="all, delete-orphan")


class Meal(Base):
    __tablename__ = "meals"

    id           = Column(Integer, primary_key=True, index=True)
    daily_plan_id= Column(Integer, ForeignKey("daily_plans.id", ondelete="CASCADE"))
    slot         = Column(SlotTypeEnum, nullable=False)
    dish_id      = Column(Integer, ForeignKey("dishes.id", ondelete="SET NULL"), nullable=True)
    kcal         = Column(Float, nullable=True)
    macros_json  = Column(JSON, nullable=True)  # {carbs_g, proteins_g, fats_g}

    daily_plan = relationship("DailyPlan", back_populates="meals")
    dish       = relationship("Dish",      back_populates="meals")


# ---------------------------------------------------------------------------
# Weight Log
# ---------------------------------------------------------------------------

class WeightLog(Base):
    __tablename__ = "weight_logs"

    id           = Column(Integer, primary_key=True, index=True)
    profile_id   = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"))
    date         = Column(Date, nullable=False)
    weight_kg    = Column(Float, nullable=False)
    body_fat_pct = Column(Float, nullable=True)

    profile = relationship("Profile", back_populates="weight_logs")


# ---------------------------------------------------------------------------
# Grocery List
# ---------------------------------------------------------------------------

class GroceryList(Base):
    __tablename__ = "grocery_lists"

    id          = Column(Integer, primary_key=True, index=True)
    meal_plan_id= Column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), unique=True)

    meal_plan = relationship("MealPlan",     back_populates="grocery_list")
    items     = relationship("GroceryItem",  back_populates="grocery_list", cascade="all, delete-orphan")


class GroceryItem(Base):
    __tablename__ = "grocery_items"

    id              = Column(Integer, primary_key=True, index=True)
    grocery_list_id = Column(Integer, ForeignKey("grocery_lists.id", ondelete="CASCADE"))
    ingredient_id   = Column(Integer, ForeignKey("ingredients.id",   ondelete="CASCADE"))
    quantity_g      = Column(Float, nullable=False)
    checked         = Column(Boolean, nullable=False, default=False)

    grocery_list = relationship("GroceryList", back_populates="items")
    ingredient   = relationship("Ingredient",  back_populates="grocery_items")
