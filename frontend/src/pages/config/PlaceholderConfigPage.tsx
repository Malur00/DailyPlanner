import { Alert, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
  titleKey: string
}

export function PlaceholderConfigPage({ titleKey }: Props) {
  const { t } = useTranslation()
  return (
    <Container>
      <h4 className="mb-3">{t(titleKey)}</h4>
      <Alert variant="info">{t('common.notImplemented')}</Alert>
    </Container>
  )
}
