from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import Dish, DishIngredient
from app.schemas.diet import (
    DishCreate, DishUpdate, DishResponse,
    DishIngredientCreate, DishIngredientResponse,
)

router = APIRouter()


@router.get("/", response_model=list[DishResponse])
def list_dishes(
    dish_type:  str = Query(default=None, description="primary | secondary | side"),
    slot:       str = Query(default=None, description="breakfast | lunch | ..."),
    profile_id: int = Query(default=None, description="Filter by profile (null = global)"),
    db: Session = Depends(get_db),
):
    q = db.query(Dish)
    if dish_type:
        q = q.filter(Dish.dish_type == dish_type)
    if slot:
        q = q.filter(Dish.meal_slots.contains([slot]))
    if profile_id is not None:
        q = q.filter((Dish.profile_id == profile_id) | (Dish.profile_id.is_(None)))
    return q.all()


@router.post("/", response_model=DishResponse, status_code=status.HTTP_201_CREATED)
def create_dish(data: DishCreate, db: Session = Depends(get_db)):
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


@router.get("/{dish_id}", response_model=DishResponse)
def get_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish


@router.put("/{dish_id}", response_model=DishResponse)
def update_dish(dish_id: int, data: DishUpdate, db: Session = Depends(get_db)):
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    for key, value in data.model_dump().items():
        setattr(dish, key, value)
    db.commit()
    db.refresh(dish)
    return dish


@router.delete("/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    db.delete(dish)
    db.commit()


@router.post("/{dish_id}/ingredients", response_model=DishIngredientResponse, status_code=status.HTTP_201_CREATED)
def add_ingredient(dish_id: int, data: DishIngredientCreate, db: Session = Depends(get_db)):
    if not db.get(Dish, dish_id):
        raise HTTPException(status_code=404, detail="Dish not found")
    di = DishIngredient(dish_id=dish_id, **data.model_dump())
    db.add(di)
    db.commit()
    db.refresh(di)
    return di


@router.delete("/{dish_id}/ingredients/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_ingredient(dish_id: int, ingredient_id: int, db: Session = Depends(get_db)):
    di = (
        db.query(DishIngredient)
        .filter(DishIngredient.dish_id == dish_id, DishIngredient.ingredient_id == ingredient_id)
        .first()
    )
    if not di:
        raise HTTPException(status_code=404, detail="Ingredient not in dish")
    db.delete(di)
    db.commit()
