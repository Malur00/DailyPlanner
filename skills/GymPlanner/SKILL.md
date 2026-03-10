---
name: gym-planner
description: >
  Use this skill to plan gym periodization, build microcycle routines, or log
  workout sessions. Triggers for GANTT timeline management, exercise creation,
  session logging, or rest countdown timer use.
---

# GymPlanner

## Overview
GymPlanner allows the user to design training periodization plans using a
GANTT timeline (Macrocycle → Mesocycle → Microcycle), build detailed
microcycle routines, and log workout sessions with a built-in rest
countdown timer between sets.

## Menu Pages

### Gym GANTT
- Visual GANTT timeline powered by frappe-gantt
- Three-level hierarchy: Macrocycle → Mesocycle → Microcycle
- All levels use custom user-defined start/end dates (no fixed rules)
- Create, edit, delete any cycle
- Color-coded bars by level
- Each Microcycle links to one Routine

### Microcycle Routine Creator
- Build workout sessions per day within a microcycle
- Fully manual exercise library (user creates all exercises)
- Session structure per exercise:
    Exercise → Sets → Reps → Weight (kg) → Rest time (seconds)
- Built-in rest countdown timer between sets
- Notes per exercise and per session

## Data Model (summary)
- Macrocycle      : id, name, start_date, end_date, notes
- Mesocycle       : id, macrocycle_id, name, start_date, end_date, notes
- Microcycle      : id, mesocycle_id, name, start_date, end_date, routine_id
- Exercise        : id, name, muscle_group, equipment, notes
- Routine         : id, name, [RoutineDay]
- RoutineDay      : id, routine_id, day_label, [RoutineExercise]
- RoutineExercise : id, routine_day_id, exercise_id, sets, reps,
                    weight_kg, rest_seconds
- SessionLog      : id, microcycle_id, date, [ExerciseLog]
- ExerciseLog     : id, session_log_id, exercise_id, actual_sets,
                    actual_reps, actual_weight_kg, notes
