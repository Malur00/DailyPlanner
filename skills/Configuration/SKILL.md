---
name: configuration
description: >
  Use this skill for global application settings. Triggers when the user wants
  to manage user profiles, configure banks, define file import formats,
  set up category mapping rules for transaction imports, or configure
  DietPlanner algorithm settings.
---

# Configuration

## Overview
Global configuration module shared across all DailyPlanner modules.
Manages user profiles (DietPlanner), bank accounts, file import formats,
and category mapping rules (SavingPlanner).

## Menu Pages

### User Profiles
Manage multi-profile settings used by DietPlanner.

  Personal Data:
  - Name, Gender (Male/Female)
  - Age (years), Weight (kg), Height (cm), Body Fat (%)

  Goals & Activity:
  - Goal             : Weight loss / Maintenance / Mass gain
  - Body structure   : Ectomorph / Mesomorph / Endomorph
  - Physical activity: Sedentary / Light / Moderate / Intense / Very intense
  - Calc. formula    : Mifflin-St Jeor / Harris-Benedict
  - Weigh-in day     : Monday … Sunday

  Meal Distribution (%):
  - Breakfast, Morning snack, Lunch, Afternoon snack, Dinner
  - Live validation: sum must equal 100%

  Macro Distribution (%):
  - Carbohydrates, Proteins, Fats
  - Live validation: sum must equal 100%

  Per-slot Macro Distribution (ProfileGoalDist):
  - For each meal slot (Breakfast, Morning snack, Lunch, Afternoon snack, Dinner)
    define an independent macro split: Carbohydrates %, Proteins %, Fats %
  - Live validation: sum must equal 100% per slot
  - Example: Breakfast = 70% carbs / 20% prot / 10% fat
             Lunch     = 30% carbs / 50% prot / 20% fat

  Preview panel (real-time):
  - BMR, TDEE (Fabbisogno), Kcal target
  - Macros in grams: Carbo, Prot, Fats

### DietPlanner Settings
Algorithm parameters for the Auto Weekly Plan Generator.

  - Max rebalance iterations (N) : integer, default = 3
      Maximum number of iterations the algorithm runs when trying to
      balance macronutrients for a meal slot (adding Secondary/Side dishes
      or rebalancing portion sizes / ingredient quantities)

### Banks
Manage bank accounts used for transaction import.
- Fields: Name, Code (e.g. INTESA), File Format (FK), Color (#hex), Status
- Actions: add, edit, deactivate, delete

### File Formats
Define column mapping for each bank's Excel export format.
- Fields:
    Code, Description, File type (.xls / .xlsx)
    Header row (0-based index)
    Column mappings: Date, Amount, Description, Details,
                     Category, Currency, Account/Card,
                     Balance, Causale
    Date format (YYYY-MM-DD / DD/MM/YYYY / …)
- Actions: add, edit (Modifica), delete

### Category Mapping
Rules to auto-assign micro → macro categories during transaction import.
- Fields:
    Format (FK to FileFormat)
    Field  (causale / descrizione_operazione / …)
    Match type (LIKE / EXACT / REGEX)
    Pattern (e.g. %STIPENDIO%, %MUTUO%)
    Micro category → Macro category
    Priority (integer, lower = higher priority)
    Active (boolean)
- Filter by Format
- Actions: add (Nuovo Mapping), edit (Modifica), delete

## Data Model (summary)
- Bank                : id, name, code, file_format_id, color_hex, active
- FileFormat          : id, code, description, file_type,
                        header_row, date_format,
                        col_date, col_amount, col_description,
                        col_details, col_category, col_currency,
                        col_account_card, col_balance, col_causale
- CategoryMappingRule : id, file_format_id, field, match_type,
                        pattern, micro_category_id, priority, active
- MacroCategory       : id, name, type (income/expense), color
- MicroCategory       : id, macro_category_id, name
