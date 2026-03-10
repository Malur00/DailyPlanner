---
name: daily-planner-pwa
description: >
  Use this skill for the DailyPlanner mobile PWA companion app. Triggers on
  requests about mobile installation, offline mode, push notifications,
  rest timer alerts, grocery list on mobile, or dashboard widget.
---

# DailyPlanner — PWA (Mobile)

## Overview
DailyPlanner PWA is a Progressive Web App companion for the DailyPlanner
desktop application. Separate repository, optimized for mobile use, installable
on iOS and Android home screens. Connects to the same FastAPI backend
as the desktop app via the shared Docker network.

## Repository
  Name   : DailyPlanner-PWA
  Backend: shared — same FastAPI instance as DailyPlanner desktop

## Mobile Menu (subset)
```
├── Dashboard        (overview cards for all modules)
├── Calendar         (aggregated: meals, gym sessions, financial events)
└── DietPlanner
    └── Grocery List
```

## PWA Features

### Installable
- Web App Manifest: name, icons, theme_color, display: standalone
- Add to Home Screen on iOS and Android
- Custom splash screen and app icons (192×192, 512×512)

### Offline Mode
- Service Worker via Workbox (vite-plugin-pwa)
- Cached routes: Dashboard, Calendar, Grocery List
- Offline data storage: IndexedDB (Dexie.js)
- Background sync: grocery list check/uncheck synced when back online
- Stale-while-revalidate strategy for API calls

### Push Notifications
- Rest Timer (GymPlanner)
    Triggered from desktop session in progress
    Countdown completes → push notification fires on mobile
    Requires user permission (Web Push API + VAPID keys)
- Daily Dashboard Summary (optional, configurable)
    Morning notification with: today's kcal target, workout, balance

### Quick Dashboard Widget
- Today's calorie progress vs. target
- Today's gym session (if any)
- Monthly savings balance
- Accessible from home screen shortcut

## Tech Stack
| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Framework      | React + TypeScript + Vite               |
| PWA Plugin     | vite-plugin-pwa (Workbox)               |
| UI Framework   | Bootstrap 5.x (react-bootstrap)         |
| i18n           | react-i18next — languages: en, it       |
| Calendar       | FullCalendar.io                         |
| Offline Store  | IndexedDB via Dexie.js                  |
| Push Notif.    | Web Push API + VAPID keys               |
| API            | Shared FastAPI backend                  |
| Container      | Dockerfile (served via Nginx)           |

## Project Structure
```
DailyPlanner-PWA/
├── public/
│   ├── manifest.json
│   └── icons/               # 192×192, 512×512
├── src/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Calendar/
│   │   └── DietPlanner/
│   │       └── GroceryList/
│   ├── service-worker/      # Workbox config
│   ├── offline/             # Dexie.js schemas + sync logic
│   └── notifications/       # Web Push API + VAPID
├── vite.config.ts           # vite-plugin-pwa config
└── Dockerfile               # Nginx static serve
```

## Constraints
- No login — mirrors desktop app (no auth)
- Light theme
- Language files: en, it
- Mobile-first responsive design
- Connects to shared FastAPI backend (same Docker network)
- Offline-capable pages: Dashboard, Calendar, Grocery List
