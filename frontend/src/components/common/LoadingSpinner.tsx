import { Spinner } from 'react-bootstrap'

interface Props {
  message?: string
}

export function LoadingSpinner({ message }: Props) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" variant="primary" role="status" />
      {message && <p className="mt-2 text-muted small">{message}</p>}
    </div>
  )
}
