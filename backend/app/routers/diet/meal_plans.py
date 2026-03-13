from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import MealPlan
from app.schemas.diet import MealPlanCreate, MealPlanResponse, GeneratePlanRequest
from app.services.diet.meal_plan_generator import generate_weekly_plan

router = APIRouter()


@router.get(
    "",
    response_model=list[MealPlanResponse],
    summary="List meal plans for a profile",
)
def list_meal_plans(
    profile_id: int = Query(..., description="Profile ID — required"),
    db: Session = Depends(get_db),
):
    """Return all meal plans for the given profile, ordered by insertion order."""
    return db.query(MealPlan).filter(MealPlan.profile_id == profile_id).all()


@router.post(
    "",
    response_model=MealPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an empty meal plan",
)
def create_meal_plan(data: MealPlanCreate, db: Session = Depends(get_db)):
    """
    Create an empty MealPlan shell (no DailyPlans or Meals).

    Use `POST /generate` to create a fully populated plan automatically.
    Use this endpoint only when you want to build the plan manually.
    """
    plan = MealPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get(
    "/{plan_id}",
    response_model=MealPlanResponse,
    summary="Get meal plan (full: 7 daily plans × 5 meal slots)",
)
def get_meal_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a full MealPlan including all nested DailyPlans and Meals.

    Each Meal contains:
    - **slot** — one of the 5 daily slots.
    - **dish** — the assigned Dish with its ingredient list.
    - **kcal** / **macros_json** — computed nutritional values.
    """
    plan = db.get(MealPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return plan


@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete meal plan and all nested data",
)
def delete_meal_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Delete a MealPlan and cascade-delete all DailyPlans, Meals, and the
    associated GroceryList with its items.
    """
    plan = db.get(MealPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    db.delete(plan)
    db.commit()


@router.post(
    "/generate",
    response_model=MealPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Auto-generate a weekly meal plan using the macro-rebalancing algorithm",
)
def generate_plan(data: GeneratePlanRequest, db: Session = Depends(get_db)):
    """
    Trigger the automatic weekly plan generator.

    **Algorithm overview (per day × per slot):**

    1. Filter `primary` dishes that match the slot and day_preferences.
    2. Exclude dishes already used ≥ `max_per_week` times.
    3. Randomly select one primary dish.
    4. Compare actual macro % to the ProfileGoalDist target for the slot (±5 % tolerance).
    5a. `variable_portions = false` → add a `secondary`/`side` dish with the dominant
        macro gap, then scale the primary portion size — up to **N** iterations (default N=3).
    5b. `variable_portions = true` → scale individual ingredient quantities — up to **N** iterations.
    6. Persist Meal → DailyPlan → MealPlan rows.
    7. Auto-generate the GroceryList by aggregating ingredient totals across all meals.

    **N** (max rebalancing iterations) is configured in DietPlanner Settings (default = 3).

    Returns the complete MealPlan with all nested data.
    """
    try:
        plan = generate_weekly_plan(db, data.profile_id, data.week_start_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return plan
