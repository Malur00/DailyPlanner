import { Dropdown, ButtonGroup, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../../context/ProfileContext'

export function TopBar() {
  const { t, i18n } = useTranslation()
  const { profiles, activeProfile, setActiveProfileId } = useProfile()

  const changeLanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  return (
    <div
      className="d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom"
      style={{ height: 52, flexShrink: 0 }}
    >
      {/* Left: breadcrumb / title placeholder */}
      <div />

      {/* Right: profile + language */}
      <div className="d-flex align-items-center gap-3">
        {/* Profile selector */}
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="outline-secondary"
            size="sm"
            id="profile-dropdown"
          >
            {activeProfile ? activeProfile.name : t('profiles.title')}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Header>{t('dashboard.activeProfile')}</Dropdown.Header>
            {profiles.length === 0 && (
              <Dropdown.Item disabled>{t('common.noData')}</Dropdown.Item>
            )}
            {profiles.map(p => (
              <Dropdown.Item
                key={p.id}
                active={p.id === activeProfile?.id}
                onClick={() => setActiveProfileId(p.id)}
              >
                {p.name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        {/* Language switcher */}
        <ButtonGroup size="sm">
          <Button
            variant={i18n.language === 'en' ? 'primary' : 'outline-secondary'}
            onClick={() => changeLanguage('en')}
          >
            EN
          </Button>
          <Button
            variant={i18n.language === 'it' ? 'primary' : 'outline-secondary'}
            onClick={() => changeLanguage('it')}
          >
            IT
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}
