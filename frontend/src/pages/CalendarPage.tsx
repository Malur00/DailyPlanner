import { Alert, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function CalendarPage() {
  const { t } = useTranslation()
  return (
    <Container>
      <h4 className="mb-3">{t('nav.calendar')}</h4>
      <Alert variant="info">{t('common.notImplemented')}</Alert>
    </Container>
  )
}
