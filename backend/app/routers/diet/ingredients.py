from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import Ingredient
from app.schemas.diet import (
    AILookupRequest, AILookupResponse,
    IngredientCreate, IngredientUpdate, IngredientResponse,
)
from app.services.diet.claude_ai import lookup_macros

router = APIRouter()


@router.get("/", response_model=list[IngredientResponse])
def list_ingredients(
    search: str = Query(default="", description="Search by name"),
    month:  int = Query(default=None, ge=1, le=12, description="Filter by available month"),
    db: Session = Depends(get_db),
):
    q = db.query(Ingredient)
    if search:
        q = q.filter(Ingredient.name.ilike(f"%{search}%"))
    if month:
        q = q.filter(Ingredient.seasonality_months.contains([month]))
    return q.all()


@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def create_ingredient(data: IngredientCreate, db: Session = Depends(get_db)):
    ingredient = Ingredient(**data.model_dump())
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.get("/{ingredient_id}", response_model=IngredientResponse)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@router.put("/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(ingredient_id: int, data: IngredientUpdate, db: Session = Depends(get_db)):
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for key, value in data.model_dump().items():
        setattr(ingredient, key, value)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(ingredient)
    db.commit()


@router.post("/ai-lookup", response_model=AILookupResponse)
async def ai_lookup(data: AILookupRequest):
    """Ask Claude AI for macronutrient estimates. Does NOT save to DB — user must confirm first."""
    result = await lookup_macros(data.name)
    return result
