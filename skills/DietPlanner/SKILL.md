---
name: diet-planner
description: >
  Use this skill to manage diet plans, dishes, ingredients, and grocery lists.
  Triggers for meal planning, Kcal calculation, macro tracking, weight/body fat
  logging, weekly plan generation, or AI-assisted macronutrient lookup.
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
Manage the dish library used to compose the weekly meal plan.

  Dish fields:
  - Name *
  - Dish type *             (Primary Dish / Secondary Dish / Side)
  - Max times/week          (integer, e.g. 2)
  - User                    (Global = all profiles / specific profile)
  - Meal slots              (multi-checkbox: Colazione, Spuntino, Pranzo, Cena)
  - Variable proportions    (bool — if true, the auto-plan engine can rebalance
                             ingredient quantities within this dish to hit macro
                             targets; engine implementation is pending)
  - Day preference          (multi-select pills: Mon Tue Wed Thu Fri Sat Sun)
  - Preparation             (textarea)
  - Ingredients             (search + add from ingredient library)

  Ingredient search in Dish:
  - Autocomplete dropdown: as the user types, up to 10 matching ingredients
    are fetched from the DB (client-side filter on cached list, case-insensitive)
  - Dropdown opens upward (bottom: 100%) to avoid clipping at the bottom of
    the scrollable modal
  - Selecting a suggestion fills the name field and enables the "Aggiungi" button
  - "Aggiungi" is disabled until a valid ingredient is selected from the dropdown
  - Already-added ingredients are excluded from suggestions
  - When search text is non-empty and no DB results are found (and no ingredient
    is currently selected), a `🤖 AI` button (outline-warning) appears inside
    the search row. Clicking calls the AI lookup → creates the ingredient
    automatically → selects it in the dish

  Quick-create dish from single ingredient (button: "+ Da Ingrediente"):
  - Dedicated modal for creating a dish composed of a single ingredient
  - Fields: ingredient search + quantity (g) + meal slot selector (multi)
  - Autocomplete dropdown opens upward (above input) to avoid modal clipping
  - `🤖 AI` button always visible when search field is non-empty:
      1. Calls AI lookup → shows preview card with estimated macros
      2. User clicks "Crea Ingrediente e Usa" → ingredient saved to DB
      3. Ingredient auto-selected; green Alert shows macro summary
  - Save disabled until an ingredient is selected and at least one meal slot is chosen
  - The dish library toolbar shows two buttons top-right:
      "+ Da Ingrediente" (outline-primary) | "+ Nuovo Piatto" (primary)

### Ingredients
Master ingredient library.

  Ingredient fields:
  - Name *
  - Kcal / 100g
  - Unit of measure         (dropdown: g, ml, …)
  - Proteins / 100g
  - Carbohydrates / 100g
  - Fats / 100g
  - Seasonality             (months available: Jan–Dec, multi-checkbox,
                             all checked by default)

  AI lookup — two entry points:
  1. Main page CTA: when debounced search returns 0 results and search field
     is non-empty, a full-width "🤖 Search with AI" button appears in place of
     the table. Clicking calls the AI, then opens the create modal pre-filled.
  2. Modal button: a compact "🤖 AI" button sits next to the Name field.
     User types a name → clicks the button → macros are filled automatically.
  In both cases the result is shown in an editable form for review before saving.

## Goal Configuration Modal
Accessible via Configuration → User Profiles → "Configura Obiettivo".

  Two tabs:
  1. **Distribuzione Pasti (%)** — % of daily Kcal assigned to each meal slot
     (Colazione, Spuntino Mattina, Pranzo, Merenda, Cena). Must sum to 100.
  2. **Macronutrienti Giornalieri (%)** — Overall daily macro split
     (Carboidrati, Proteine, Grassi). Must sum to 100. Applied uniformly to
     every slot by the auto-plan generator.

  Computed values panel (read-only, always visible below the tabs when goal
  data is available, updated on each save):
  - BMR (kcal/day), TDEE (kcal/day), Kcal Target
  - Carbohydrates (g), Proteins (g), Fats (g)

  Note: "Distribuzione Macro per Pasto" (per-slot macro splits) was removed.
  The generator uses the same global macro % for every slot. The `ProfileGoalDist`
  table still exists in the DB for backward compatibility but is no longer
  populated or used.

## Claude AI — Macronutrient Lookup
When an ingredient is not found in the database, the user can trigger an
AI-assisted lookup powered by the Anthropic API.

  Model  : configurable via ANTHROPIC_MODEL env var
           default = claude-3-haiku-20240307 (broadly available)
           override in .env: ANTHROPIC_MODEL=claude-3-5-haiku-20241022
  Config : ANTHROPIC_API_KEY from .env (never committed to git)

  Flow:
  1. User searches ingredient → not found in DB
  2. User clicks "Search with AI"
  3. Backend calls Anthropic API with ingredient name
  4. Claude returns estimated: Kcal/100g, Proteins, Carbs, Fats, Unit
  5. Results shown in editable form for user review / correction
  6. User confirms → ingredient saved to DB
  7. Feature available in: Ingredients page + Dish ingredient search

  .env example:
    ANTHROPIC_API_KEY=sk-ant-...   # never commit this file

## Auto Weekly Plan Generator Algorithm
Generates a full weekly meal plan for a profile respecting caloric and
macro targets. Configured via DietPlanner Settings (Configuration menu).

  Config:
    N = max rebalance iterations (from DietPlanner Settings, default = 3)

  FOR each week_day (Mon → Sun):
    FOR each meal_slot (breakfast, morning_snack, lunch, afternoon_snack, dinner):

      Step 1 — Filter Primary Dishes
        SELECT dishes WHERE dish_type = 'Primary'
                        AND meal_slots ∋ current_slot

      Step 2 — Apply day_preferences
        Prefer dishes whose day_preferences include current week_day

      Step 3 — Apply max_per_week
        Exclude dishes already used max_per_week times this week

      Step 4 — Random selection
        Pick randomly from filtered list
        Calculate total macronutrients of selected dish at portion_scale = 1.0

      Step 4b — Scale portion to hit slot kcal target
        slot_kcal_target = kcal_target × meal_dist_{slot}_pct / 100
        portion_scale = slot_kcal_target / dish_kcal_at_scale_1
        Recompute macros at new portion_scale
        (kcal_target = BMR × activity_factor ± goal offset, computed inline)

      Step 5 — Compare macro % to global target from ProfileGoal
        target = { macro_carbs_pct, macro_proteins_pct, macro_fats_pct }
                 from ProfileGoal — same target applied to every slot

        IF actual macros ≠ target macros:

          IF variable_portions = false:
            a. Identify the macro with the largest gap (carbs / proteins / fats)
            b. Find Secondary Dishes or Sides WHERE that macro is dominant
               (dominant = macro providing the highest % of total calories)
            c. Add Secondary/Side to the meal list
            d. Rebalance PRIMARY dish portion size (total grams served)
               — ingredient ratios inside the dish are NOT changed
            e. Repeat steps b–d up to N iterations until targets are met

          IF variable_portions = true:
            a. Rebalance ingredient quantities within the dish
               to hit the macro targets
            b. Repeat up to N iterations

  Output: DailyPlan entries for the full week

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

  Computed values panel shows (read-only, updated on save):
    BMR, TDEE, Kcal target, Macros in grams

## Features
- Multi-profile: each profile has own goals, weight, body fat %
- N configurable meals per day (set in Configuration → User Profiles)
- Per-slot Kcal % distribution (used by generator to scale portions) + global macro % (set in Configuration → User Profiles)
- Auto weekly meal plan generator with macro rebalancing algorithm
- Weight and body fat % log (per day)
- Weekly auto-recalculation of plan based on weight/fat trend
- Grocery list auto-generated from weekly plan + manually editable
- AI-assisted macronutrient lookup via Anthropic API (model configurable via ANTHROPIC_MODEL)

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
    macro_carbs_pct, macro_proteins_pct, macro_fats_pct  -- overall day, sum to 100

- ProfileGoalDist                               -- legacy: exists in DB, not used by UI/generator
    id, profilegoal_id, slot_type,
    macro_carbs_pct, macro_proteins_pct, macro_fats_pct

- Ingredient
    id, name, unit, kcal_per_100g, proteins_g, carbs_g, fats_g,
    seasonality_months[]                        -- e.g. [1,2,3,10,11,12]

- Dish (Pasto)
    id, name,
    dish_type (primary/secondary/side),
    max_per_week, profile_id (null = global),
    meal_slots[],                               -- colazione/spuntino/pranzo/cena
    variable_portions,                          -- bool (engine rebalances ingredients)
    day_preferences[],                          -- mon/tue/…/sun
    preparation

- DishIngredient     : id, dish_id, ingredient_id, quantity_g
- MealPlan           : id, profile_id, week_start_date, [DailyPlan]
- DailyPlan          : id, meal_plan_id, date, [Meal]
- Meal               : id, daily_plan_id, slot, dish_id, kcal, macros_json
- WeightLog          : id, profile_id, date, weight_kg, body_fat_pct
- GroceryList        : id, meal_plan_id, [GroceryItem]
- GroceryItem        : id, grocery_list_id, ingredient_id, quantity_g, checked

## API Reference

Base URL: `http://localhost:8000/api/diet`
Swagger UI: `http://localhost:8000/docs`

### Profiles  `/api/diet/profiles`

| Method | Path | Description |
|--------|------|-------------|
| GET    |              | List all profiles |
| POST   |              | Create profile → 201 |
| GET    | `/{id}`      | Get profile by ID |
| PUT    | `/{id}`      | Update profile (full replace) |
| DELETE | `/{id}`      | Delete profile + cascade |
| GET    | `/{id}/goal` | Get goal config + computed BMR / TDEE / macro grams |
| PUT    | `/{id}/goal` | Upsert goal config (replaces all distributions) |

**Constraints:**
- `meal_dist_*` fields must sum to **100**.
- `macro_carbs_pct` + `macro_proteins_pct` + `macro_fats_pct` must sum to **100**.
- `activity_level` TDEE multipliers: sedentary=1.2, light=1.375, moderate=1.55, intense=1.725, very_intense=1.9.
- `goal` Kcal adjustments: weight_loss=−500 kcal, maintenance=0, mass=+300 kcal.
- Computed fields (bmr, tdee, kcal_target, carbs_g, proteins_g, fats_g) are returned by the server, never stored.

---

### Ingredients  `/api/diet/ingredients`

| Method | Path | Description |
|--------|------|-------------|
| GET    |              | List (query: `search=`, `month=`) |
| POST   |              | Create ingredient → 201 |
| GET    | `/{id}`      | Get ingredient |
| PUT    | `/{id}`      | Update ingredient (full replace) |
| DELETE | `/{id}`      | Delete ingredient |
| POST   | `/ai-lookup` | Claude AI macro estimate — preview only, does NOT save |

**Constraints:**
- All macro values are expressed **per 100 g / 100 ml**.
- `seasonality_months`: integer array 1–12; `null` = available all year.
- `POST /ai-lookup` calls the configured Anthropic model — requires `ANTHROPIC_API_KEY` in `.env`.
  Result is a **preview only**: user must confirm then call `POST /` to persist.

---

### Dishes  `/api/diet/dishes`

| Method | Path | Description |
|--------|------|-------------|
| GET    |                                      | List (query: `dish_type=`, `slot=`, `profile_id=`) |
| POST   |                                      | Create dish + optional ingredients → 201 |
| GET    | `/{id}`                              | Get dish with ingredient list |
| PUT    | `/{id}`                              | Update dish metadata (ingredients unchanged) |
| DELETE | `/{id}`                              | Delete dish + DishIngredients (cascade) |
| POST   | `/{id}/ingredients`                  | Add ingredient to dish → 201 |
| DELETE | `/{id}/ingredients/{ingredient_id}`  | Remove ingredient from dish |

**Constraints:**
- `dish_type`: `primary` = main course (selected by generator); `secondary` = macro corrector; `side` = condiment/extra.
- `variable_portions = false` (default): generator scales overall portion size — ingredient ratios are fixed.
- `variable_portions = true`: generator scales individual ingredient quantities.
- `profile_id = null` → global dish (available to all profiles).
- Filtering by `profile_id` returns both profile-specific AND global dishes.
- `PUT /{id}` does NOT update the ingredient list — use sub-endpoints for that.

---

### Meal Plans  `/api/diet/meal-plans`

| Method | Path | Description |
|--------|------|-------------|
| GET    |              | List plans for a profile (query: `profile_id=` required) |
| POST   |              | Create empty plan → 201 |
| GET    | `/{id}`      | Get full plan (7 days × 5 slots, nested dishes) |
| DELETE | `/{id}`      | Delete plan + cascade (DailyPlans, Meals, GroceryList) |
| POST   | `/generate`  | Auto-generate weekly plan + GroceryList → 201 |

**Constraints:**
- `week_start_date` should be a **Monday** (ISO 8601 date).
- `POST /generate` requires: configured ProfileGoal (meal dist + macro % summing to 100)
  and at least one `primary` dish per slot. Returns HTTP 422 with a descriptive message
  if the profile has no goal configured.
- GroceryList is **auto-created** by `/generate` — it aggregates ingredient quantities across all week meals.
- Max rebalance iterations **N** is read from DietPlanner Settings (Configuration menu, default = 3).

---

### Weight Logs  `/api/diet/weight-logs`

| Method | Path | Description |
|--------|------|-------------|
| GET    |         | List entries (query: `profile_id=` required, `from=`, `to=`) |
| POST   |         | Add weigh-in entry → 201 |
| DELETE | `/{id}` | Delete entry |

**Constraints:**
- `profile_id` query param is **required**.
- Results are returned ordered by `date` ascending.
- `from` / `to` query params accept ISO 8601 date strings.
- `body_fat_pct` is optional (0–100).

---

### Grocery Lists  `/api/diet/grocery-lists`

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/{meal_plan_id}`                        | Get grocery list with all items |
| POST   | `/{meal_plan_id}/items`                  | Manually add item → 201 |
| PUT    | `/{meal_plan_id}/items/{item_id}`        | Update item quantity |
| DELETE | `/{meal_plan_id}/items/{item_id}`        | Remove item |
| PATCH  | `/{meal_plan_id}/items/{item_id}/check`  | Toggle checked state |

**Constraints:**
- One GroceryList per MealPlan (1 : 1 relationship).
- `PATCH /check` body: `{ "checked": true | false }` — true = purchased, false = still needed.
- Manual items can be added for extras not included in the meal plan (e.g. condiments).
