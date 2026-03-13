import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import IngredientsPage from './pages/diet/IngredientsPage'
import MealsPage from './pages/diet/MealsPage'
import GroceryListPage from './pages/diet/GroceryListPage'
import WeightLogsPage from './pages/diet/WeightLogsPage'
import GymPage from './pages/gym/GymPage'
import SavingPage from './pages/saving/SavingPage'
import UserProfilesPage from './pages/config/UserProfilesPage'
import DietSettingsPage from './pages/config/DietSettingsPage'
import { PlaceholderConfigPage } from './pages/config/PlaceholderConfigPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<CalendarPage />} />

        {/* DietPlanner */}
        <Route path="diet">
          <Route path="ingredients" element={<IngredientsPage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="grocery" element={<GroceryListPage />} />
          <Route path="weight-logs" element={<WeightLogsPage />} />
        </Route>

        {/* GymPlanner */}
        <Route path="gym" element={<GymPage />} />

        {/* SavingPlanner */}
        <Route path="saving" element={<SavingPage />} />

        {/* Configuration */}
        <Route path="config">
          <Route path="profiles" element={<UserProfilesPage />} />
          <Route path="diet-settings" element={<DietSettingsPage />} />
          <Route path="banks" element={<PlaceholderConfigPage titleKey="nav_config.banks" />} />
          <Route path="file-formats" element={<PlaceholderConfigPage titleKey="nav_config.fileFormats" />} />
          <Route path="category-mapping" element={<PlaceholderConfigPage titleKey="nav_config.categoryMapping" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
