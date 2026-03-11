from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import MealPlan
from app.schemas.diet import MealPlanCreate, MealPlanResponse, GeneratePlanRequest
from app.services.diet.meal_plan_generator import generate_weekly_plan

router = APIRouter()


@router.get("/", response_model=list[MealPlanResponse])
def list_meal_plans(
    profile_id: int = Query(..., description="Profile ID"),
    db: Session = Depends(get_db),
):
    return db.query(MealPlan).filter(MealPlan.profile_id == profile_id).all()


@router.post("/", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
def create_meal_plan(data: MealPlanCreate, db: Session = Depends(get_db)):
    plan = MealPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=MealPlanResponse)
def get_meal_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(MealPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(MealPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    db.delete(plan)
    db.commit()


@router.post("/generate", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
def generate_plan(data: GeneratePlanRequest, db: Session = Depends(get_db)):
    """Auto-generate a weekly meal plan using the macro rebalancing algorithm."""
    plan = generate_weekly_plan(db, data.profile_id, data.week_start_date)
    return plan
