from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.diet import profiles, ingredients, dishes, meal_plans, weight_logs, grocery_lists
from app.routers import gym, saving

app = FastAPI(
    title="DailyPlanner API",
    description="Personal productivity planner — DietPlanner, GymPlanner, SavingPlanner",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


# DietPlanner
app.include_router(profiles.router,      prefix="/api/diet/profiles",      tags=["Diet — Profiles"])
app.include_router(ingredients.router,   prefix="/api/diet/ingredients",   tags=["Diet — Ingredients"])
app.include_router(dishes.router,        prefix="/api/diet/dishes",        tags=["Diet — Dishes"])
app.include_router(meal_plans.router,    prefix="/api/diet/meal-plans",    tags=["Diet — Meal Plans"])
app.include_router(weight_logs.router,   prefix="/api/diet/weight-logs",   tags=["Diet — Weight Logs"])
app.include_router(grocery_lists.router, prefix="/api/diet/grocery-lists", tags=["Diet — Grocery Lists"])

# Placeholders
app.include_router(gym.router,    prefix="/api/gym",    tags=["GymPlanner"])
app.include_router(saving.router, prefix="/api/saving", tags=["SavingPlanner"])


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}
