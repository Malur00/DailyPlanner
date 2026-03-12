import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SIDEBAR_KEY = 'sidebarExpanded'

const modules: {
  key: string
  labelKey: string
  path?: string
  children?: { labelKey: string; path: string }[]
}[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', path: '/' },
  { key: 'calendar', labelKey: 'nav.calendar', path: '/calendar' },
  {
    key: 'diet', labelKey: 'nav.dietPlanner',
    children: [
      { labelKey: 'nav_diet.ingredients', path: '/diet/ingredients' },
      { labelKey: 'nav_diet.meals', path: '/diet/meals' },
      { labelKey: 'nav_diet.groceryList', path: '/diet/grocery' },
      { labelKey: 'weightLogs.title', path: '/diet/weight-logs' },
    ],
  },
  {
    key: 'gym', labelKey: 'nav.gymPlanner',
    children: [
      { labelKey: 'nav_gym.gantt', path: '/gym' },
    ],
  },
  {
    key: 'saving', labelKey: 'nav.savingPlanner',
    children: [
      { labelKey: 'nav_saving.transactions', path: '/saving' },
    ],
  },
  {
    key: 'config', labelKey: 'nav.configuration',
    children: [
      { labelKey: 'nav_config.userProfiles', path: '/config/profiles' },
      { labelKey: 'nav_config.dietSettings', path: '/config/diet-settings' },
      { labelKey: 'nav_config.banks', path: '/config/banks' },
      { labelKey: 'nav_config.fileFormats', path: '/config/file-formats' },
      { labelKey: 'nav_config.categoryMapping', path: '/config/category-mapping' },
    ],
  },
]

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'false'
  })
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const path = location.pathname
    const state: Record<string, boolean> = {}
    modules.forEach(m => {
      if (m.children?.some(c => path.startsWith(c.path))) {
        state[m.key] = true
      }
    })
    return state
  })

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(SIDEBAR_KEY, String(!next))
  }

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div
      className="d-flex flex-column bg-dark text-white"
      style={{
        width: collapsed ? 56 : 240,
        minHeight: '100vh',
        flexShrink: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-2 border-bottom border-secondary">
        {!collapsed && (
          <span className="fw-bold text-white ms-1" style={{ fontSize: 15 }}>
            DailyPlanner
          </span>
        )}
        <button
          className="btn btn-sm btn-outline-light ms-auto"
          onClick={toggleCollapsed}
          title="Toggle sidebar"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Navigation */}
      <Nav className="flex-column mt-2 flex-grow-1" as="ul">
        {modules.map(module => {
          if (module.path && !module.children) {
            // Simple link
            return (
              <Nav.Item as="li" key={module.key}>
                <NavLink
                  to={module.path}
                  end
                  className={({ isActive }) =>
                    `nav-link text-white px-3 py-2 ${isActive ? 'bg-primary rounded mx-1' : ''}`
                  }
                >
                  {!collapsed && t(module.labelKey)}
                </NavLink>
              </Nav.Item>
            )
          }

          // Section with children
          const isOpen = openSections[module.key] ?? false
          const hasActive = module.children?.some(c => location.pathname.startsWith(c.path))

          return (
            <Nav.Item as="li" key={module.key}>
              <button
                className={`btn btn-link text-white text-decoration-none w-100 text-start px-3 py-2 d-flex align-items-center justify-content-between ${hasActive ? 'fw-semibold' : ''}`}
                onClick={() => !collapsed && toggleSection(module.key)}
                title={collapsed ? t(module.labelKey) : undefined}
              >
                <span>{!collapsed && t(module.labelKey)}</span>
                {!collapsed && (
                  <span style={{ fontSize: 12 }}>{isOpen ? '▾' : '▸'}</span>
                )}
              </button>
              {!collapsed && isOpen && (
                <ul className="list-unstyled ps-3">
                  {module.children?.map(child => (
                    <li key={child.path}>
                      <NavLink
                        to={child.path}
                        className={({ isActive }) =>
                          `nav-link text-white-50 py-1 px-2 small ${isActive ? 'text-white fw-semibold' : ''}`
                        }
                      >
                        {t(child.labelKey)}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </Nav.Item>
          )
        })}
      </Nav>
    </div>
  )
}
