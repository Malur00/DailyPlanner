import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../context/ProfileContext'
import { useMealPlans } from '../hooks/useMealPlans'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

function ProfileSummary() {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0]

  const { data: plans = [] } = useMealPlans(activeProfile?.id ?? null)
  const { data: logs = [] } = useWeightLogs(activeProfile?.id ?? null, weekAgo, today)

  if (!activeProfile) return null

  const currentWeekStart = (() => {
    const d = new Date()
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  })()

  const currentPlan = plans.find(p => p.week_start_date === currentWeekStart)
  const latestLog = logs[logs.length - 1]

  return (
    <Row className="g-3 mt-3">
      <Col md={4}>
        <Card className="h-100">
          <Card.Body>
            <Card.Subtitle className="text-muted mb-1 small">{t('weightLogs.title')}</Card.Subtitle>
            <div className="fs-4 fw-bold">
              {latestLog ? `${latestLog.weight_kg} kg` : '—'}
            </div>
            {latestLog?.body_fat_pct != null && (
              <div className="text-muted small">{latestLog.body_fat_pct}% {t('weightLogs.bodyFatPct')}</div>
            )}
          </Card.Body>
          <Card.Footer>
            <Button size="sm" variant="outline-primary" onClick={() => navigate('/diet/weight-logs')}>
              {t('dashboard.logWeight')}
            </Button>
          </Card.Footer>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100">
          <Card.Body>
            <Card.Subtitle className="text-muted mb-1 small">{t('dashboard.currentPlan')}</Card.Subtitle>
            <div className="fs-5 fw-semibold">
              {currentPlan
                ? `${currentPlan.daily_plans.length} ${t('common.week').toLowerCase()}`
                : t('dashboard.noPlan')}
            </div>
          </Card.Body>
          <Card.Footer>
            <Button size="sm" variant="outline-primary" onClick={() => navigate('/diet/meals')}>
              {currentPlan ? t('nav_diet.meals') : t('dashboard.generatePlan')}
            </Button>
          </Card.Footer>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100">
          <Card.Body>
            <Card.Subtitle className="text-muted mb-1 small">{t('dashboard.quickActions')}</Card.Subtitle>
          </Card.Body>
          <Card.Footer className="d-flex flex-wrap gap-2">
            <Button size="sm" variant="outline-secondary" onClick={() => navigate('/diet/ingredients')}>
              {t('nav_diet.ingredients')}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => navigate('/diet/grocery')}>
              {t('nav_diet.groceryList')}
            </Button>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { profiles, activeProfile, setActiveProfileId, isLoading } = useProfile()
  const navigate = useNavigate()

  if (isLoading) return <LoadingSpinner />

  return (
    <Container fluid>
      <h4 className="mb-4">{t('dashboard.title')}</h4>

      {profiles.length === 0 && (
        <Alert variant="info">
          {t('dashboard.noProfiles')}
          <div className="mt-2">
            <Button size="sm" variant="primary" onClick={() => navigate('/config/profiles')}>
              {t('profiles.newProfile')}
            </Button>
          </div>
        </Alert>
      )}

      {/* Profile cards */}
      <Row className="g-3">
        {profiles.map(profile => {
          const isActive = activeProfile?.id === profile.id
          const bmi = (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
          return (
            <Col key={profile.id} md={6} lg={4} xl={3}>
              <Card border={isActive ? 'primary' : undefined} className={isActive ? 'shadow-sm' : ''}>
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Card.Title className="mb-0">{profile.name}</Card.Title>
                    {isActive && <Badge bg="primary">{t('dashboard.active')}</Badge>}
                  </div>
                  <div className="small text-muted">
                    <Badge bg={profile.goal === 'weight_loss' ? 'info' : profile.goal === 'mass' ? 'success' : 'secondary'} className="me-1">
                      {profile.goal.replace('_', ' ')}
                    </Badge>
                    {profile.weight_kg} kg · BMI {bmi}
                  </div>
                </Card.Body>
                {!isActive && (
                  <Card.Footer>
                    <Button
                      size="sm" variant="outline-primary" className="w-100"
                      onClick={() => setActiveProfileId(profile.id)}
                    >
                      {t('dashboard.setActive')}
                    </Button>
                  </Card.Footer>
                )}
              </Card>
            </Col>
          )
        })}
      </Row>

      {activeProfile && <ProfileSummary />}
    </Container>
  )
}
