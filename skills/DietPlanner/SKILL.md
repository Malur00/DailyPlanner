---
name: diet-planner
description: >
  Use this skill to manage diet plans, recipes, ingredients, and grocery lists.
  Triggers for meal planning, Kcal calculation, macro tracking, weight/body fat
  logging, or weekly plan generation.
---

# DietPlanner

## Overview
Multi-profile web module for weekly diet calculation and management.
Automatically generates a daily meal plan divided into N configurable meals,
respecting the user's caloric and macronutrient needs. Supports weight and
body fat % tracking, recalculating the plan weekly based on the user's progress.

## Menu Pages

### Grocery List
- Auto-generated from the active weekly meal plan
- Manually editable (add / remove / check items)
- Grouped by food category
- Printable view

### Meals
- Daily meal plan: N configurable slots (breakfast, lunch, dinner, snacks…)
- Recipe assignment per meal slot
- Kcal and macro summary per meal and per day
- Weekly plan overview

### Ingredients
- Master ingredient library (fully manual entry)
- Fields: name, unit, proteins (g), carbohydrates (g), fats (g), Kcal/100g

## Kcal Calculation
  Standard macro formula:
    Kcal = (Proteins × 4) + (Carbohydrates × 4) + (Fats × 9)

  Daily caloric goal via selectable formula:
    Mifflin-St Jeor:
      Men:   BMR = (10 × kg) + (6.25 × cm) - (5 × age) + 5
      Women: BMR = (10 × kg) + (6.25 × cm) - (5 × age) - 161
    Harris-Benedict (alternative)
    TDEE = BMR × activity_factor

  Kcal target adjusted by Goal:
    Weight loss  → TDEE - deficit
    Maintenance  → TDEE
    Mass gain    → TDEE + surplus

  Preview panel shows in real-time:
    MB (BMR), Fabbisogno (TDEE), Kcal target,
    Macro validation (sum = 100%), Macros in grams

## Features
- Multi-profile: each profile has own goals, weight, body fat %
- N configurable meals per day
- Auto-generate weekly meal plan respecting caloric + macro targets
- Weight and body fat % log (per day)
- Weekly auto-recalculation of plan based on weight/fat trend
- Grocery list auto-generated from weekly plan + manually editable

## Data Model (summary)
- Profile
    id, name, gender, age, weight_kg, height_cm, body_fat_pct,
    goal (weight_loss/maintenance/mass),
    body_structure (ectomorph/mesomorph/endomorph),
    activity_level (sedentary/light/moderate/intense/very_intense),
    calc_formula (mifflin/harris),
    weigh_day (mon…sun)

- ProfileGoal
    id, profile_id,
    meal_dist_breakfast_pct, meal_dist_morning_snack_pct,
    meal_dist_lunch_pct, meal_dist_afternoon_snack_pct,
    meal_dist_dinner_pct,                       -- must sum to 100
    macro_carbs_pct, macro_proteins_pct, macro_fats_pct  -- must sum to 100

- Ingredient      : id, name, unit, proteins_g, carbs_g, fats_g, kcal_per_100g
- Recipe          : id, name, description, [RecipeIngredient]
- RecipeIngredient: id, recipe_id, ingredient_id, quantity_g
- MealPlan        : id, profile_id, week_start_date, [DailyPlan]
- DailyPlan       : id, meal_plan_id, date, [Meal]
- Meal            : id, daily_plan_id, slot, recipe_id, kcal, macros_json
- WeightLog       : id, profile_id, date, weight_kg, body_fat_pct
- GroceryList     : id, meal_plan_id, [GroceryItem]
- GroceryItem     : id, grocery_list_id, ingredient_id, quantity_g, checked
