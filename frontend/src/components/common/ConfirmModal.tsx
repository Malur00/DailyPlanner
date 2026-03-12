import { Modal, Button, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
  show: boolean
  title?: string
  body: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  confirmVariant?: 'danger' | 'primary'
}

export function ConfirmModal({
  show,
  title,
  body,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmVariant = 'danger',
}: Props) {
  const { t } = useTranslation()

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title ?? t('confirm.deleteTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" animation="border" className="me-1" /> : null}
          {t('common.confirm')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
