import { Alert, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function SavingPage() {
  const { t } = useTranslation()
  return (
    <Container>
      <h4 className="mb-3">{t('nav.savingPlanner')}</h4>
      <Alert variant="info">{t('common.notImplemented')}</Alert>
    </Container>
  )
}
