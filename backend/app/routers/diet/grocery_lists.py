from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import GroceryList, GroceryItem
from app.schemas.diet import (
    GroceryItemCreate, GroceryItemResponse,
    GroceryListResponse, GroceryItemCheckUpdate,
)

router = APIRouter()


@router.get("/{meal_plan_id}", response_model=GroceryListResponse)
def get_grocery_list(meal_plan_id: int, db: Session = Depends(get_db)):
    grocery = db.query(GroceryList).filter(GroceryList.meal_plan_id == meal_plan_id).first()
    if not grocery:
        raise HTTPException(status_code=404, detail="Grocery list not found")
    return grocery


@router.post("/{meal_plan_id}/items", response_model=GroceryItemResponse, status_code=status.HTTP_201_CREATED)
def add_item(meal_plan_id: int, data: GroceryItemCreate, db: Session = Depends(get_db)):
    grocery = db.query(GroceryList).filter(GroceryList.meal_plan_id == meal_plan_id).first()
    if not grocery:
        raise HTTPException(status_code=404, detail="Grocery list not found")
    item = GroceryItem(grocery_list_id=grocery.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{meal_plan_id}/items/{item_id}", response_model=GroceryItemResponse)
def update_item(meal_plan_id: int, item_id: int, data: GroceryItemCreate, db: Session = Depends(get_db)):
    item = db.get(GroceryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in data.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{meal_plan_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(meal_plan_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.get(GroceryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.patch("/{meal_plan_id}/items/{item_id}/check", response_model=GroceryItemResponse)
def toggle_check(meal_plan_id: int, item_id: int, data: GroceryItemCheckUpdate, db: Session = Depends(get_db)):
    item = db.get(GroceryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.checked = data.checked
    db.commit()
    db.refresh(item)
    return item
