---
name: daily-planner
description: >
  Use this skill when the user wants to navigate or manage the DailyPlanner
  dashboard. Triggers on requests about diet, gym, saving modules, or
  cross-module views like Dashboard, Calendar, Configuration, and PWA mobile.
---

# DailyPlanner — Main Dashboard

## Overview
DailyPlanner is a personal productivity application running as a Dockerized
service on a private Windows Server. No authentication required.
Multi-profile support. Three integrated planning modules in a unified dashboard.
A companion PWA (separate repository) provides mobile access to a subset of features.

## Modules
| Module        | Description                                 | Key Feature                     |
|---------------|---------------------------------------------|---------------------------------|
| DietPlanner   | Weekly diet plan with macro tracking        | Auto meal plan generator        |
| GymPlanner    | Gym periodization with GANTT timeline       | Microcycle builder + rest timer |
| SavingPlanner | Personal cash flow and savings goals        | Excel import + cash flow view   |

## Menu Structure

### Desktop (Web)
```
├── Dashboard              (overview cards for all modules)
├── Calendar               (aggregated: meals, gym sessions, financial events)
├── DietPlanner
│   ├── Grocery List
│   ├── Meals
│   └── Ingredients
├── GymPlanner
│   ├── Gym GANTT
│   └── Microcycle Routine Creator
├── SavingPlanner
│   ├── Transactions       (includes Import Cash Flow)
│   ├── Cash Flow
│   ├── Saving Goals
│   └── Reports
└── Configuration
    ├── User Profiles
    ├── DietPlanner Settings
    ├── Banks
    ├── File Formats
    └── Category Mapping
```

### Mobile PWA (separate repo — subset only)
```
├── Dashboard              (overview cards)
├── Calendar               (aggregated view)
└── DietPlanner
    └── Grocery List
```

## Tech Stack

### Desktop
| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | React + TypeScript + Vite               |
| UI Framework   | Bootstrap 5.x (react-bootstrap)         |
| i18n           | react-i18next — languages: en, it       |
| Calendar       | FullCalendar.io                         |
| GANTT          | frappe-gantt                            |
| Backend        | FastAPI (Python) — single shared API    |
| API Docs       | Swagger / OpenAPI                       |
| Database       | PostgreSQL                              |
| Claude AI      | Anthropic API — claude-haiku-3-5        |
| Infrastructure | Docker Compose on Windows Server        |

### Mobile PWA
| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Framework      | React + TypeScript + Vite               |
| PWA Plugin     | vite-plugin-pwa (Workbox)               |
| UI Framework   | Bootstrap 5.x — mobile-first            |
| Offline Store  | IndexedDB via Dexie.js                  |
| Push Notif.    | Web Push API + VAPID keys               |
| API            | Same shared FastAPI backend             |

## Common Constraints
- No login — single personal use, multi-profile
- Currency: € EUR
- Units: Metric (kg, g, cm)
- Light theme
- Single shared API base for all modules
- Language files: en, it

## API

| Setting | Value |
|---------|-------|
| Base URL (dev) | `http://localhost:8000` |
| Swagger UI     | `http://localhost:8000/docs` |
| OpenAPI JSON   | `http://localhost:8000/openapi.json` |
| Health check   | `GET /health` |

**Routing prefix per module:**
| Module       | Prefix         | Status |
|--------------|----------------|--------|
| DietPlanner  | `/api/diet/*`  | Implemented |
| GymPlanner   | `/api/gym/*`   | Not yet implemented — HTTP 501 |
| SavingPlanner| `/api/saving/*`| Not yet implemented — HTTP 501 |

**Global API rules:**
- All responses use **JSON**.
- Date fields use **ISO 8601** (e.g. `2025-06-02`).
- Units: **metric** (kg, g, cm) — no imperial conversion.
- No authentication headers required.
- CORS: all origins allowed (development configuration).
- Successful resource creation returns **HTTP 201**.
- Missing resources return **HTTP 404**.
- Validation errors return **HTTP 422** (Pydantic / FastAPI standard).
