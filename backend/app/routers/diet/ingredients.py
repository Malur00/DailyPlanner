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


@router.get(
    "/",
    response_model=list[IngredientResponse],
    summary="List ingredients (optional: filter by name / available month)",
)
def list_ingredients(
    search: str = Query(default="", description="Case-insensitive substring search on ingredient name"),
    month:  int = Query(default=None, ge=1, le=12, description="Return only ingredients available in this month (1–12); null = all"),
    db: Session = Depends(get_db),
):
    """
    Return all ingredients, optionally filtered:

    - **search** — partial name match (e.g. `chick` matches *Chicken breast*, *Chickpeas*).
    - **month** — seasonality filter; pass the calendar month (1–12) to exclude
      out-of-season ingredients. Ingredients with `seasonality_months = null` are
      always included (available all year round).
    """
    q = db.query(Ingredient)
    if search:
        q = q.filter(Ingredient.name.ilike(f"%{search}%"))
    if month:
        q = q.filter(Ingredient.seasonality_months.contains([month]))
    return q.all()


@router.post(
    "/",
    response_model=IngredientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new ingredient to the master library",
)
def create_ingredient(data: IngredientCreate, db: Session = Depends(get_db)):
    """
    Persist a new ingredient.

    Typical flow: call `POST /ai-lookup` first to get Claude AI estimates,
    review the values, then call this endpoint to save the confirmed ingredient.

    All macro values (**proteins_g**, **carbs_g**, **fats_g**, **kcal_per_100g**)
    are expressed **per 100 g / 100 ml**.
    """
    ingredient = Ingredient(**data.model_dump())
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.get(
    "/{ingredient_id}",
    response_model=IngredientResponse,
    summary="Get ingredient by ID",
)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Retrieve a single ingredient by its primary key. Returns 404 if not found."""
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@router.put(
    "/{ingredient_id}",
    response_model=IngredientResponse,
    summary="Update ingredient",
)
def update_ingredient(ingredient_id: int, data: IngredientUpdate, db: Session = Depends(get_db)):
    """Full replacement update of an ingredient (all fields required)."""
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for key, value in data.model_dump().items():
        setattr(ingredient, key, value)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete(
    "/{ingredient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete ingredient",
)
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """
    Delete an ingredient from the master library.

    ⚠️ If the ingredient is referenced by any Dish, the deletion will fail
    (foreign-key constraint). Remove it from all dishes first.
    """
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(ingredient)
    db.commit()


@router.post(
    "/ai-lookup",
    response_model=AILookupResponse,
    summary="Ask Claude AI for macro estimates (preview only — does NOT save)",
)
async def ai_lookup(data: AILookupRequest):
    """
    Send the ingredient name to **Claude claude-haiku-3-5** and receive estimated
    nutritional values per 100 g.

    **This endpoint does NOT persist any data.**
    Review the returned values and call `POST /ingredients` to save the ingredient.

    Returned fields:
    - `kcal_per_100g`, `proteins_g`, `carbs_g`, `fats_g` — per 100 g estimates.
    - `unit` — unit of measure as interpreted by the AI (default: `g`).
    """
    result = await lookup_macros(data.name)
    return result
