from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.diet import DietSettings
from app.schemas.diet import DietSettingsResponse, DietSettingsUpdate

router = APIRouter()

_DEFAULTS = {"macro_tolerance_pct": 5.0, "max_rebalance_iterations": 3}


def _get_or_create(db: Session) -> DietSettings:
    """Return the singleton DietSettings row (id=1), creating it with defaults if absent."""
    obj = db.get(DietSettings, 1)
    if not obj:
        obj = DietSettings(id=1, **_DEFAULTS)
        db.add(obj)
        db.commit()
        db.refresh(obj)
    return obj


@router.get(
    "",
    response_model=DietSettingsResponse,
    summary="Get global diet generator settings",
)
def get_settings(db: Session = Depends(get_db)):
    """
    Return the global DietPlanner generator settings (singleton).

    | Field | Default | Description |
    |---|---|---|
    | **macro_tolerance_pct** | 5.0 | ±% tolerance before macro rebalancing stops |
    | **max_rebalance_iterations** | 3 | Max iterations per slot in the plan generator |

    If settings have never been saved, returns the built-in defaults.
    """
    return _get_or_create(db)


@router.put(
    "",
    response_model=DietSettingsResponse,
    summary="Update global diet generator settings",
)
def update_settings(data: DietSettingsUpdate, db: Session = Depends(get_db)):
    """
    Update the global DietPlanner generator settings.

    - **macro_tolerance_pct**: 1–20 (default 5). The generator stops rebalancing when all
      macro percentages are within ±tolerance of the target.
    - **max_rebalance_iterations**: 1–10 (default 3). Maximum number of macro rebalancing
      loops per meal slot during plan generation.
    """
    obj = _get_or_create(db)
    obj.macro_tolerance_pct      = data.macro_tolerance_pct
    obj.max_rebalance_iterations = data.max_rebalance_iterations
    db.commit()
    db.refresh(obj)
    return obj
