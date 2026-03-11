from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/")
def saving_placeholder():
    return JSONResponse(status_code=501, content={"detail": "SavingPlanner — not yet implemented"})
