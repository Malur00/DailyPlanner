from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.diet import profiles, ingredients, dishes, meal_plans, weight_logs, grocery_lists
from app.routers import gym, saving

# ---------------------------------------------------------------------------
# OpenAPI tag metadata — shown as section headers in Swagger UI
# ---------------------------------------------------------------------------

TAGS_METADATA = [
    {
        "name": "Diet — Profiles",
        "description": (
            "Manage user profiles for DietPlanner. Each profile stores personal data "
            "(age, weight, height, body fat %) and is linked to a **ProfileGoal** that "
            "defines daily Kcal targets, macro distribution (carbs / proteins / fats %), "
            "meal slot distribution (%), and per-slot macro splits (ProfileGoalDist). "
            "BMR, TDEE and macro grams are computed server-side via Mifflin-St Jeor or "
            "Harris-Benedict and returned in the goal response."
        ),
    },
    {
        "name": "Diet — Ingredients",
        "description": (
            "Master ingredient library. All values are expressed **per 100 g**. "
            "Seasonality stores the list of months (1–12) when the ingredient is available. "
            "If an ingredient is not found in the database, use **POST /ai-lookup** to ask "
            "Claude AI (claude-haiku-3-5) for estimated macros — results are returned for "
            "user review and are **not** saved automatically."
        ),
    },
    {
        "name": "Diet — Dishes",
        "description": (
            "Dish (Pasto) library used by the weekly meal plan generator. "
            "Each dish has a **dish_type**: `primary` (main selection), `secondary` or `side` "
            "(used as macro correctors by the algorithm). "
            "`meal_slots` defines which meal slots the dish can be assigned to. "
            "`variable_portions` controls whether the generator may rebalance ingredient "
            "quantities inside the dish (future engine). "
            "`max_per_week` limits how many times the dish can appear in a weekly plan."
        ),
    },
    {
        "name": "Diet — Meal Plans",
        "description": (
            "Weekly meal plans for a profile. Use **POST /generate** to trigger the "
            "auto-generator algorithm: for each day × slot it selects primary dishes, "
            "checks macro targets (ProfileGoalDist), and iteratively adds secondary/side "
            "dishes or rebalances portion sizes (up to N iterations, configurable). "
            "A GroceryList is auto-generated from the resulting plan."
        ),
    },
    {
        "name": "Diet — Weight Logs",
        "description": (
            "Daily weight and body fat % tracking for a profile. "
            "Used by the weekly plan recalculator to adjust TDEE over time."
        ),
    },
    {
        "name": "Diet — Grocery Lists",
        "description": (
            "Auto-generated from a MealPlan (ingredient totals aggregated across all meals). "
            "Items can be added manually and checked/unchecked as purchased."
        ),
    },
    {
        "name": "GymPlanner",
        "description": "🚧 Not yet implemented — returns HTTP 501.",
    },
    {
        "name": "SavingPlanner",
        "description": "🚧 Not yet implemented — returns HTTP 501.",
    },
    {
        "name": "System",
        "description": "Health check and system utilities.",
    },
]

app = FastAPI(
    title="DailyPlanner API",
    description=(
        "## Personal productivity planner\n\n"
        "Single shared REST API for three modules: **DietPlanner**, **GymPlanner**, **SavingPlanner**.\n\n"
        "### Common constraints\n"
        "- No authentication — single personal use, multi-profile\n"
        "- Currency: € EUR | Units: Metric (kg, g, cm)\n"
        "- All macro percentages must sum to **100** (validated server-side)\n"
        "- Kcal formula: `(Proteins × 4) + (Carbohydrates × 4) + (Fats × 9)`\n"
        "- TDEE: Mifflin-St Jeor or Harris-Benedict × activity factor\n\n"
        "### AI feature\n"
        "`POST /api/diet/ingredients/ai-lookup` — calls **claude-haiku-3-5** to estimate "
        "macronutrients for an unknown ingredient. Results must be confirmed by the user "
        "before being saved to the database."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=TAGS_METADATA,
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


@app.get("/health", tags=["System"], summary="Health check")
def health():
    """Returns `{status: ok}` when the API is running."""
    return {"status": "ok"}
