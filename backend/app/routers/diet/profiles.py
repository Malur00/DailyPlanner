from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import Profile, ProfileGoal, ProfileGoalDist
from app.schemas.diet import (
    ProfileCreate, ProfileUpdate, ProfileResponse,
    ProfileGoalCreate, ProfileGoalResponse,
)
from app.services.diet.kcal import compute_goal_preview

router = APIRouter()


# ---------------------------------------------------------------------------
# Profiles CRUD
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ProfileResponse])
def list_profiles(db: Session = Depends(get_db)):
    return db.query(Profile).all()


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(data: ProfileCreate, db: Session = Depends(get_db)):
    profile = Profile(**data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
def update_profile(profile_id: int, data: ProfileUpdate, db: Session = Depends(get_db)):
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in data.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(profile)
    db.commit()


# ---------------------------------------------------------------------------
# Profile Goal
# ---------------------------------------------------------------------------

@router.get("/{profile_id}/goal", response_model=ProfileGoalResponse)
def get_goal(profile_id: int, db: Session = Depends(get_db)):
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not profile.goal_config:
        raise HTTPException(status_code=404, detail="Goal not configured for this profile")
    goal = profile.goal_config
    response = ProfileGoalResponse.model_validate(goal)
    preview = compute_goal_preview(profile, goal)
    response.bmr         = preview["bmr"]
    response.tdee        = preview["tdee"]
    response.kcal_target = preview["kcal_target"]
    response.carbs_g     = preview["carbs_g"]
    response.proteins_g  = preview["proteins_g"]
    response.fats_g      = preview["fats_g"]
    return response


@router.put("/{profile_id}/goal", response_model=ProfileGoalResponse)
def upsert_goal(profile_id: int, data: ProfileGoalCreate, db: Session = Depends(get_db)):
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    goal = profile.goal_config
    goal_data = data.model_dump(exclude={"distributions"})

    if goal:
        for key, value in goal_data.items():
            setattr(goal, key, value)
        # Replace distributions
        for dist in goal.distributions:
            db.delete(dist)
    else:
        goal = ProfileGoal(profile_id=profile_id, **goal_data)
        db.add(goal)
        db.flush()

    for dist_data in data.distributions:
        dist = ProfileGoalDist(profilegoal_id=goal.id, **dist_data.model_dump())
        db.add(dist)

    db.commit()
    db.refresh(goal)
    response = ProfileGoalResponse.model_validate(goal)
    preview = compute_goal_preview(profile, goal)
    response.bmr         = preview["bmr"]
    response.tdee        = preview["tdee"]
    response.kcal_target = preview["kcal_target"]
    response.carbs_g     = preview["carbs_g"]
    response.proteins_g  = preview["proteins_g"]
    response.fats_g      = preview["fats_g"]
    return response
