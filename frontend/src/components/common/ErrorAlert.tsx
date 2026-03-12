import { Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
  error: unknown
  onDismiss?: () => void
}

function getErrorMessage(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any
  return e?.response?.data?.detail ?? e?.message ?? String(error)
}

export function ErrorAlert({ error, onDismiss }: Props) {
  const { t } = useTranslation()
  const message = getErrorMessage(error) || t('common.error')

  return (
    <Alert variant="danger" dismissible={!!onDismiss} onClose={onDismiss}>
      <Alert.Heading>{t('common.error')}</Alert.Heading>
      <p className="mb-0">{message}</p>
    </Alert>
  )
}
