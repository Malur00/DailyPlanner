from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import WeightLog
from app.schemas.diet import WeightLogCreate, WeightLogResponse

router = APIRouter()


@router.get(
    "/",
    response_model=list[WeightLogResponse],
    summary="List weight log entries for a profile (filterable by date range)",
)
def list_weight_logs(
    profile_id: int  = Query(..., description="Profile ID — required"),
    from_date:  date = Query(default=None, alias="from", description="Start date inclusive (ISO 8601, e.g. 2025-01-01)"),
    to_date:    date = Query(default=None, alias="to",   description="End date inclusive (ISO 8601, e.g. 2025-12-31)"),
    db: Session = Depends(get_db),
):
    """
    Return weight log entries for a profile ordered by **date ascending**.

    Use **from** / **to** query parameters to restrict to a date range.
    Both are optional; omitting them returns the full history.
    """
    q = db.query(WeightLog).filter(WeightLog.profile_id == profile_id)
    if from_date:
        q = q.filter(WeightLog.date >= from_date)
    if to_date:
        q = q.filter(WeightLog.date <= to_date)
    return q.order_by(WeightLog.date).all()


@router.post(
    "/",
    response_model=WeightLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a weight log entry",
)
def create_weight_log(data: WeightLogCreate, db: Session = Depends(get_db)):
    """
    Record a weigh-in.

    - **weight_kg** — body weight in kg (required).
    - **body_fat_pct** — body fat percentage (optional; used for lean-mass tracking).

    The preferred weigh-in day is configurable per profile via `weigh_day`.
    """
    log = WeightLog(**data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete(
    "/{log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a weight log entry",
)
def delete_weight_log(log_id: int, db: Session = Depends(get_db)):
    """Delete a single weight log entry. Returns 404 if not found."""
    log = db.get(WeightLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Weight log not found")
    db.delete(log)
    db.commit()
