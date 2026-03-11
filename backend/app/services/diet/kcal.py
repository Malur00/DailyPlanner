"""Kcal / BMR / TDEE calculation helpers."""

ACTIVITY_FACTORS = {
    "sedentary":   1.2,
    "light":       1.375,
    "moderate":    1.55,
    "intense":     1.725,
    "very_intense":1.9,
}

GOAL_ADJUSTMENTS = {
    "weight_loss": -500,
    "maintenance":    0,
    "mass":         +300,
}


def compute_bmr(profile) -> float:
    """Mifflin-St Jeor or Harris-Benedict BMR."""
    w = profile.weight_kg
    h = profile.height_cm
    a = profile.age

    if profile.calc_formula == "mifflin":
        base = (10 * w) + (6.25 * h) - (5 * a)
        return base + 5 if profile.gender == "male" else base - 161
    else:
        # Harris-Benedict
        if profile.gender == "male":
            return 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a)
        return 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a)


def compute_goal_preview(profile, goal) -> dict:
    bmr        = round(compute_bmr(profile), 1)
    tdee       = round(bmr * ACTIVITY_FACTORS.get(profile.activity_level, 1.55), 1)
    adjustment = GOAL_ADJUSTMENTS.get(profile.goal, 0)
    kcal_target= round(tdee + adjustment, 1)

    carbs_g    = round((kcal_target * goal.macro_carbs_pct    / 100) / 4, 1)
    proteins_g = round((kcal_target * goal.macro_proteins_pct / 100) / 4, 1)
    fats_g     = round((kcal_target * goal.macro_fats_pct     / 100) / 9, 1)

    return {
        "bmr":        bmr,
        "tdee":       tdee,
        "kcal_target":kcal_target,
        "carbs_g":    carbs_g,
        "proteins_g": proteins_g,
        "fats_g":     fats_g,
    }
