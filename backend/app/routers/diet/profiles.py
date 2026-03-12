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

@router.get(
    "/",
    response_model=list[ProfileResponse],
    summary="List all profiles",
)
def list_profiles(db: Session = Depends(get_db)):
    """Return all user profiles stored in the system (no pagination — expected to be a small set)."""
    return db.query(Profile).all()


@router.post(
    "/",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new profile",
)
def create_profile(data: ProfileCreate, db: Session = Depends(get_db)):
    """
    Create a user profile.

    - **gender** + **weight_kg** + **height_cm** + **age** are used for BMR/TDEE computation.
    - **activity_level** determines the TDEE multiplier (1.2 → 1.9).
    - **goal** adjusts the daily Kcal target: weight_loss −500 kcal, maintenance 0, mass +300 kcal.
    - **calc_formula**: `mifflin` = Mifflin-St Jeor (default), `harris` = Harris-Benedict.
    """
    profile = Profile(**data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get(
    "/{profile_id}",
    response_model=ProfileResponse,
    summary="Get profile by ID",
)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    """Retrieve a single profile. Returns 404 if not found."""
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put(
    "/{profile_id}",
    response_model=ProfileResponse,
    summary="Update profile",
)
def update_profile(profile_id: int, data: ProfileUpdate, db: Session = Depends(get_db)):
    """
    Full replacement update of a profile (all fields required).
    Changing **weight_kg**, **age**, or **activity_level** automatically affects
    the computed BMR/TDEE returned by `GET /{id}/goal`.
    """
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in data.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete profile",
)
def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    """
    Delete a profile and all related data (cascade): ProfileGoal, ProfileGoalDist,
    MealPlans, WeightLogs, and Dishes owned by this profile.
    """
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(profile)
    db.commit()


# ---------------------------------------------------------------------------
# Profile Goal
# ---------------------------------------------------------------------------

@router.get(
    "/{profile_id}/goal",
    response_model=ProfileGoalResponse,
    summary="Get goal configuration (with computed BMR / TDEE / macros)",
)
def get_goal(profile_id: int, db: Session = Depends(get_db)):
    """
    Return the ProfileGoal for this profile together with server-side computed fields:

    | Field | Description |
    |---|---|
    | **bmr** | Basal Metabolic Rate (kcal/day) — Mifflin-St Jeor or Harris-Benedict |
    | **tdee** | Total Daily Energy Expenditure = BMR × activity multiplier |
    | **kcal_target** | Daily Kcal target = TDEE + goal adjustment (−500 / 0 / +300) |
    | **carbs_g** | Daily carbohydrates in grams |
    | **proteins_g** | Daily proteins in grams |
    | **fats_g** | Daily fats in grams |

    Returns 404 if goal has not been configured yet.
    """
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


@router.put(
    "/{profile_id}/goal",
    response_model=ProfileGoalResponse,
    summary="Create or update goal configuration (upsert)",
)
def upsert_goal(profile_id: int, data: ProfileGoalCreate, db: Session = Depends(get_db)):
    """
    Upsert the ProfileGoal for this profile.

    - All **meal_dist_*_pct** fields must sum to **100**.
    - All **macro_*_pct** fields must sum to **100**.
    - The optional **distributions** list sets per-slot macro splits
      (one entry per meal slot); each entry's macros must also sum to **100**.
    - Existing distributions are fully replaced on every call.

    Returns the saved goal with computed BMR/TDEE/macro grams.
    """
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
