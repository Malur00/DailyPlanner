from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import WeightLog
from app.schemas.diet import WeightLogCreate, WeightLogResponse

router = APIRouter()


@router.get("/", response_model=list[WeightLogResponse])
def list_weight_logs(
    profile_id: int  = Query(...),
    from_date:  date = Query(default=None, alias="from"),
    to_date:    date = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
):
    q = db.query(WeightLog).filter(WeightLog.profile_id == profile_id)
    if from_date:
        q = q.filter(WeightLog.date >= from_date)
    if to_date:
        q = q.filter(WeightLog.date <= to_date)
    return q.order_by(WeightLog.date).all()


@router.post("/", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
def create_weight_log(data: WeightLogCreate, db: Session = Depends(get_db)):
    log = WeightLog(**data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight_log(log_id: int, db: Session = Depends(get_db)):
    log = db.get(WeightLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Weight log not found")
    db.delete(log)
    db.commit()
