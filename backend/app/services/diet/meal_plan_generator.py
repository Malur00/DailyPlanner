"""Auto weekly meal plan generator.

Algorithm (from DietPlanner SKILL.md):
  For each day (Mon→Sun) × each slot (breakfast…dinner):
    1. Filter Primary dishes matching slot + day_preferences
    2. Exclude dishes used >= max_per_week times already
    3. Random select → compute macros at portion_scale = 1.0
    4. Scale portion to hit slot kcal target
       slot_kcal_target = kcal_target × meal_dist_{slot}_pct / 100
       (kcal_target derived from profile BMR × activity_factor ± goal offset)
    5. Compare macro % to global target (same for every slot)
    5a. variable_portions=False → add Secondary/Side with dominant macro gap
        → rebalance primary portion size (scale total grams, NOT ingredient ratios)
        → iterate up to N times
    5b. variable_portions=True  → scale ingredient quantities to hit target
        → iterate up to N times
    6. Create Meal, DailyPlan, MealPlan + GroceryList rows
"""

import random
from collections import defaultdict
from datetime import date, timedelta
from types import SimpleNamespace

from sqlalchemy.orm import Session

from app.models.diet import (
    Dish, DishIngredient, DailyPlan, GroceryItem,
    GroceryList, Ingredient, Meal, MealPlan,
    Profile, ProfileGoal,
)
from app.services.diet.kcal import compute_goal_preview

SLOTS = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"]
DAYS  = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# Maps slot name → ProfileGoal field holding the % of daily kcal for that slot
SLOT_DIST_FIELDS = {
    "breakfast":       "meal_dist_breakfast_pct",
    "morning_snack":   "meal_dist_morning_snack_pct",
    "lunch":           "meal_dist_lunch_pct",
    "afternoon_snack": "meal_dist_afternoon_snack_pct",
    "dinner":          "meal_dist_dinner_pct",
}

# Default max iterations if DietPlanner Settings not yet implemented
DEFAULT_N = 3


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _compute_dish_macros(dish: Dish, portion_scale: float = 1.0) -> dict:
    """Return {carbs_g, proteins_g, fats_g, kcal} for a dish at given scale."""
    carbs = proteins = fats = kcal = 0.0
    for di in dish.dish_ingredients:
        ing: Ingredient = di.ingredient
        qty = di.quantity_g * portion_scale / 100.0
        carbs    += ing.carbs_g    * qty
        proteins += ing.proteins_g * qty
        fats     += ing.fats_g     * qty
        kcal     += ing.kcal_per_100g * qty
    return {
        "carbs_g":    round(carbs, 2),
        "proteins_g": round(proteins, 2),
        "fats_g":     round(fats, 2),
        "kcal":       round(kcal, 2),
    }


def _dominant_macro(macros: dict) -> str:
    """Return the macro ('carbs_g'|'proteins_g'|'fats_g') providing the most kcal."""
    cal = {
        "carbs_g":    macros["carbs_g"]    * 4,
        "proteins_g": macros["proteins_g"] * 4,
        "fats_g":     macros["fats_g"]     * 9,
    }
    return max(cal, key=cal.get)


def _macro_pct(macros: dict) -> dict:
    """Convert gram values to % of total kcal."""
    total_kcal = macros["carbs_g"] * 4 + macros["proteins_g"] * 4 + macros["fats_g"] * 9
    if total_kcal == 0:
        return {"carbs_pct": 0.0, "proteins_pct": 0.0, "fats_pct": 0.0}
    return {
        "carbs_pct":    round(macros["carbs_g"]    * 4 / total_kcal * 100, 1),
        "proteins_pct": round(macros["proteins_g"] * 4 / total_kcal * 100, 1),
        "fats_pct":     round(macros["fats_g"]     * 9 / total_kcal * 100, 1),
    }


def _largest_gap_macro(actual_pct: dict, target_dist) -> str:
    """Return which macro key ('carbs_g'|'proteins_g'|'fats_g') has the largest gap."""
    gaps = {
        "carbs_g":    abs(actual_pct["carbs_pct"]    - target_dist.macro_carbs_pct),
        "proteins_g": abs(actual_pct["proteins_pct"] - target_dist.macro_proteins_pct),
        "fats_g":     abs(actual_pct["fats_pct"]     - target_dist.macro_fats_pct),
    }
    return max(gaps, key=gaps.get)


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate_weekly_plan(
    db: Session,
    profile_id: int,
    week_start_date: date,
    N: int = DEFAULT_N,
) -> MealPlan:
    profile: Profile = db.get(Profile, profile_id)
    if not profile:
        raise ValueError(f"Profile {profile_id} not found")

    goal: ProfileGoal = profile.goal_config
    if not goal:
        raise ValueError(
            f"Profile \"{profile.name}\" has no goal configured. "
            "Go to Configuration → User Profiles → Configure Goal before generating a plan."
        )

    # Compute daily kcal target from profile BMR / TDEE / goal offset
    preview = compute_goal_preview(profile, goal)
    kcal_target: float = preview["kcal_target"]

    # Build per-slot kcal targets  (e.g. lunch = 1800 × 0.40 = 720 kcal)
    slot_kcal_targets: dict[str, float] = {
        slot: kcal_target * getattr(goal, SLOT_DIST_FIELDS[slot]) / 100
        for slot in SLOTS
    }

    # Build macro ratio target — same for every slot
    _global_target = SimpleNamespace(
        macro_carbs_pct=goal.macro_carbs_pct,
        macro_proteins_pct=goal.macro_proteins_pct,
        macro_fats_pct=goal.macro_fats_pct,
    )
    slot_targets: dict[str, object] = {slot: _global_target for slot in SLOTS}

    # Create MealPlan
    meal_plan = MealPlan(profile_id=profile_id, week_start_date=week_start_date)
    db.add(meal_plan)
    db.flush()

    usage_count: dict[int, int] = defaultdict(int)

    for day_idx in range(7):
        current_date = week_start_date + timedelta(days=day_idx)
        day_name = DAYS[day_idx]

        daily_plan = DailyPlan(meal_plan_id=meal_plan.id, date=current_date)
        db.add(daily_plan)
        db.flush()

        for slot in SLOTS:
            meal = _fill_slot(
                db, daily_plan, slot, day_name,
                slot_targets, slot_kcal_targets[slot],
                usage_count, profile_id, N,
            )
            db.add(meal)

    db.flush()

    # Auto-generate grocery list from this plan
    _build_grocery_list(db, meal_plan)

    db.commit()
    db.refresh(meal_plan)
    return meal_plan


def _fill_slot(
    db: Session,
    daily_plan: DailyPlan,
    slot: str,
    day_name: str,
    slot_targets: dict,
    slot_kcal_target: float,
    usage_count: dict,
    profile_id: int,
    N: int,
) -> Meal:
    target = slot_targets.get(slot)

    # Step 1 — Filter Primary dishes for this slot
    primary_dishes: list[Dish] = (
        db.query(Dish)
        .filter(
            Dish.dish_type == "primary",
            Dish.meal_slots.contains([slot]),
            (Dish.profile_id == profile_id) | (Dish.profile_id.is_(None)),
        )
        .all()
    )

    # Step 2 — Apply day_preferences (prefer; not mandatory)
    preferred = [d for d in primary_dishes if not d.day_preferences or day_name in d.day_preferences]
    if not preferred:
        preferred = primary_dishes

    # Step 3 — Apply max_per_week
    available = [d for d in preferred if d.max_per_week is None or usage_count[d.id] < d.max_per_week]
    if not available:
        available = preferred  # fallback: ignore limit if nothing available

    if not available:
        # No dishes configured → empty meal slot
        return Meal(daily_plan_id=daily_plan.id, slot=slot)

    # Step 4 — Random select
    selected: Dish = random.choice(available)
    usage_count[selected.id] += 1
    portion_scale = 1.0
    macros = _compute_dish_macros(selected, portion_scale)

    # Step 4b — Scale portion to hit slot kcal target
    # (e.g. if dish has 500 kcal at scale=1 and target is 720 kcal → scale=1.44)
    if slot_kcal_target > 0 and macros["kcal"] > 0:
        portion_scale = slot_kcal_target / macros["kcal"]
        macros = _compute_dish_macros(selected, portion_scale)

    # Step 5 — Compare macro % to target and rebalance
    if target:
        actual_pct = _macro_pct(macros)
        for _ in range(N):
            gap_macro = _largest_gap_macro(actual_pct, target)
            # Check if already within tolerance (±5%)
            carbs_ok    = abs(actual_pct["carbs_pct"]    - target.macro_carbs_pct)    <= 5
            proteins_ok = abs(actual_pct["proteins_pct"] - target.macro_proteins_pct) <= 5
            fats_ok     = abs(actual_pct["fats_pct"]     - target.macro_fats_pct)     <= 5
            if carbs_ok and proteins_ok and fats_ok:
                break

            if selected.variable_portions:
                # 5b — scale ingredient quantities to hit target (simple scaling)
                target_macro_pct = {
                    "carbs_g":    target.macro_carbs_pct,
                    "proteins_g": target.macro_proteins_pct,
                    "fats_g":     target.macro_fats_pct,
                }
                desired_pct = target_macro_pct[gap_macro]
                current_pct = actual_pct.get(gap_macro.replace("_g", "_pct"), 0)
                if current_pct > 0:
                    portion_scale *= (desired_pct / current_pct)
                    macros = _compute_dish_macros(selected, portion_scale)
                    actual_pct = _macro_pct(macros)
            else:
                # 5a — find Secondary/Side with gap macro as dominant
                secondary_dishes: list[Dish] = (
                    db.query(Dish)
                    .filter(
                        Dish.dish_type.in_(["secondary", "side"]),
                        Dish.meal_slots.contains([slot]),
                        (Dish.profile_id == profile_id) | (Dish.profile_id.is_(None)),
                    )
                    .all()
                )
                candidates = [
                    d for d in secondary_dishes
                    if _dominant_macro(_compute_dish_macros(d)) == gap_macro
                ]
                if candidates:
                    addition = random.choice(candidates)
                    add_macros = _compute_dish_macros(addition)
                    macros = {
                        "carbs_g":    macros["carbs_g"]    + add_macros["carbs_g"],
                        "proteins_g": macros["proteins_g"] + add_macros["proteins_g"],
                        "fats_g":     macros["fats_g"]     + add_macros["fats_g"],
                        "kcal":       macros["kcal"]       + add_macros["kcal"],
                    }
                    actual_pct = _macro_pct(macros)

                # Rebalance primary portion size (scale total grams, NOT ingredient ratios)
                if target.macro_carbs_pct > 0:
                    portion_scale *= target.macro_carbs_pct / max(actual_pct["carbs_pct"], 1)
                    macros = _compute_dish_macros(selected, portion_scale)
                    actual_pct = _macro_pct(macros)

    return Meal(
        daily_plan_id=daily_plan.id,
        slot=slot,
        dish_id=selected.id,
        kcal=macros["kcal"],
        macros_json={
            "carbs_g":    macros["carbs_g"],
            "proteins_g": macros["proteins_g"],
            "fats_g":     macros["fats_g"],
        },
    )


def _build_grocery_list(db: Session, meal_plan: MealPlan) -> None:
    """Aggregate ingredients across all meals of a plan into a GroceryList."""
    ingredient_totals: dict[int, float] = defaultdict(float)

    for daily_plan in meal_plan.daily_plans:
        for meal in daily_plan.meals:
            if not meal.dish_id:
                continue
            dish: Dish = db.get(Dish, meal.dish_id)
            if not dish:
                continue
            for di in dish.dish_ingredients:
                ingredient_totals[di.ingredient_id] += di.quantity_g

    grocery_list = GroceryList(meal_plan_id=meal_plan.id)
    db.add(grocery_list)
    db.flush()

    for ingredient_id, quantity_g in ingredient_totals.items():
        db.add(GroceryItem(
            grocery_list_id=grocery_list.id,
            ingredient_id=ingredient_id,
            quantity_g=round(quantity_g, 1),
            checked=False,
        ))
