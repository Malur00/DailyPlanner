from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import Dish, DishIngredient
from app.schemas.diet import (
    DishCreate, DishUpdate, DishResponse,
    DishIngredientCreate, DishIngredientResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=list[DishResponse],
    summary="List dishes (optional: filter by type / slot / profile)",
)
def list_dishes(
    dish_type:  str = Query(default=None, description="Filter by dish type: primary | secondary | side"),
    slot:       str = Query(default=None, description="Filter by meal slot: breakfast | morning_snack | lunch | afternoon_snack | dinner"),
    profile_id: int = Query(default=None, description="Filter by profile — returns dishes owned by this profile plus all global dishes (profile_id = null)"),
    db: Session = Depends(get_db),
):
    """
    Return dishes with optional filters.

    **Dish types:**
    - `primary` — main course; the auto-generator selects these for each slot.
    - `secondary` — macro corrector added alongside the primary dish to balance macros.
    - `side` — condiment or extra (minor macro contribution).

    When **profile_id** is provided the result includes both profile-specific dishes
    AND global dishes (`profile_id = null`).
    """
    q = db.query(Dish)
    if dish_type:
        q = q.filter(Dish.dish_type == dish_type)
    if slot:
        q = q.filter(Dish.meal_slots.contains([slot]))
    if profile_id is not None:
        q = q.filter((Dish.profile_id == profile_id) | (Dish.profile_id.is_(None)))
    return q.all()


@router.post(
    "",
    response_model=DishResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new dish (with optional ingredients)",
)
def create_dish(data: DishCreate, db: Session = Depends(get_db)):
    """
    Create a dish and optionally attach ingredients in a single request.

    - Set **variable_portions = true** if the weekly plan generator should scale
      ingredient quantities to hit macro targets.
    - Set **variable_portions = false** (default) to scale the overall portion size
      while keeping ingredient ratios fixed.
    - **max_per_week** limits how many times this dish may appear in a plan (null = unlimited).
    - **day_preferences** biases the generator toward specific weekdays (null = any day).
    """
    ingredients_data = data.ingredients
    dish_data = data.model_dump(exclude={"ingredients"})
    dish = Dish(**dish_data)
    db.add(dish)
    db.flush()
    for ing in ingredients_data:
        db.add(DishIngredient(dish_id=dish.id, **ing.model_dump()))
    db.commit()
    db.refresh(dish)
    return dish


@router.get(
    "/{dish_id}",
    response_model=DishResponse,
    summary="Get dish by ID (includes ingredient list)",
)
def get_dish(dish_id: int, db: Session = Depends(get_db)):
    """Retrieve a single dish with its full ingredient list. Returns 404 if not found."""
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish


@router.put(
    "/{dish_id}",
    response_model=DishResponse,
    summary="Update dish metadata",
)
def update_dish(dish_id: int, data: DishUpdate, db: Session = Depends(get_db)):
    """
    Full replacement update of dish metadata fields.

    **Note:** this endpoint does not modify the ingredient list.
    Use `POST /{id}/ingredients` and `DELETE /{id}/ingredients/{ingredient_id}`
    to manage ingredients separately.
    """
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    for key, value in data.model_dump().items():
        setattr(dish, key, value)
    db.commit()
    db.refresh(dish)
    return dish


@router.delete(
    "/{dish_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete dish",
)
def delete_dish(dish_id: int, db: Session = Depends(get_db)):
    """Delete a dish and all its DishIngredient rows (cascade)."""
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    db.delete(dish)
    db.commit()


@router.post(
    "/{dish_id}/ingredients",
    response_model=DishIngredientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add an ingredient to a dish",
)
def add_ingredient(dish_id: int, data: DishIngredientCreate, db: Session = Depends(get_db)):
    """
    Attach an ingredient to a dish with a specific quantity in grams.

    The **quantity_g** value represents the amount used in one standard portion of the dish.
    When `variable_portions = true`, the generator may scale this quantity up or down.
    """
    if not db.get(Dish, dish_id):
        raise HTTPException(status_code=404, detail="Dish not found")
    di = DishIngredient(dish_id=dish_id, **data.model_dump())
    db.add(di)
    db.commit()
    db.refresh(di)
    return di


@router.delete(
    "/{dish_id}/ingredients/{ingredient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove an ingredient from a dish",
)
def remove_ingredient(dish_id: int, ingredient_id: int, db: Session = Depends(get_db)):
    """Remove the DishIngredient link between a dish and an ingredient. Returns 404 if the link does not exist."""
    di = (
        db.query(DishIngredient)
        .filter(DishIngredient.dish_id == dish_id, DishIngredient.ingredient_id == ingredient_id)
        .first()
    )
    if not di:
        raise HTTPException(status_code=404, detail="Ingredient not in dish")
    db.delete(di)
    db.commit()
