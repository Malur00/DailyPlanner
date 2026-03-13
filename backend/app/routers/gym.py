from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("")
def gym_placeholder():
    return JSONResponse(status_code=501, content={"detail": "GymPlanner — not yet implemented"})
