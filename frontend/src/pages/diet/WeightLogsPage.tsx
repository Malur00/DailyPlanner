import { useState } from 'react'
import {
  Container, Table, Button, Form, Row, Col,
  Spinner, Alert,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useWeightLogs, useCreateWeightLog, useDeleteWeightLog } from '../../hooks/useWeightLogs'
import { useProfile } from '../../context/ProfileContext'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { WeightLog } from '../../types/weightLog'

export default function WeightLogsPage() {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()

  const today = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data: logs = [], isLoading, error } = useWeightLogs(
    activeProfile?.id ?? null,
    fromDate || undefined,
    toDate || undefined,
  )
  const createLog = useCreateWeightLog()
  const deleteLog = useDeleteWeightLog()

  const [addDate, setAddDate] = useState(today)
  const [addWeight, setAddWeight] = useState('')
  const [addBodyFat, setAddBodyFat] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<WeightLog | null>(null)

  if (!activeProfile) {
    return (
      <Container>
        <h4 className="mb-3">{t('weightLogs.title')}</h4>
        <Alert variant="info">{t('weightLogs.selectProfile')}</Alert>
      </Container>
    )
  }

  const handleAdd = async () => {
    if (!addDate || !addWeight) return
    await createLog.mutateAsync({
      profile_id: activeProfile.id,
      date: addDate,
      weight_kg: Number(addWeight),
      body_fat_pct: addBodyFat ? Number(addBodyFat) : null,
    })
    setAddWeight('')
    setAddBodyFat('')
    setAddDate(today)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteLog.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Container fluid>
      <h4 className="mb-3">{t('weightLogs.title')}</h4>

      {/* Add entry row */}
      <div className="border rounded p-3 mb-4 bg-light">
        <strong className="d-block mb-2 small">{t('weightLogs.addEntry')}</strong>
        <Row className="g-2 align-items-end">
          <Col md={2}>
            <Form.Label className="small">{t('weightLogs.date')}</Form.Label>
            <Form.Control
              type="date" size="sm"
              value={addDate}
              onChange={e => setAddDate(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Label className="small">{t('weightLogs.weightKg')}</Form.Label>
            <Form.Control
              type="number" size="sm" step="0.1" min={1}
              placeholder="e.g. 72.5"
              value={addWeight}
              onChange={e => setAddWeight(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Label className="small">{t('weightLogs.bodyFatPct')} ({t('common.optional')})</Form.Label>
            <Form.Control
              type="number" size="sm" step="0.1" min={0} max={100}
              placeholder="e.g. 18.0"
              value={addBodyFat}
              onChange={e => setAddBodyFat(e.target.value)}
            />
          </Col>
          <Col md="auto">
            <Button
              size="sm" variant="primary"
              onClick={handleAdd}
              disabled={!addDate || !addWeight || createLog.isPending}
            >
              {createLog.isPending
                ? <Spinner size="sm" animation="border" />
                : t('common.add')}
            </Button>
          </Col>
        </Row>
        {createLog.error && <ErrorAlert error={createLog.error} />}
      </div>

      {/* Filters */}
      <Row className="g-2 mb-3">
        <Col md={2}>
          <Form.Label className="small">{t('common.from')}</Form.Label>
          <Form.Control
            type="date" size="sm"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Form.Label className="small">{t('common.to')}</Form.Label>
          <Form.Control
            type="date" size="sm"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </Col>
        <Col md="auto" className="d-flex align-items-end">
          <Button
            size="sm" variant="outline-secondary"
            onClick={() => { setFromDate(''); setToDate('') }}
          >
            {t('common.all')}
          </Button>
        </Col>
      </Row>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}

      {!isLoading && !error && (
        <Table striped hover responsive size="sm">
          <thead className="table-light">
            <tr>
              <th>{t('weightLogs.date')}</th>
              <th>{t('weightLogs.weightKg')}</th>
              <th>{t('weightLogs.bodyFatPct')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted">{t('weightLogs.noLogs')}</td>
              </tr>
            )}
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.date}</td>
                <td><strong>{log.weight_kg} kg</strong></td>
                <td>{log.body_fat_pct != null ? `${log.body_fat_pct}%` : '—'}</td>
                <td>
                  <Button
                    size="sm" variant="outline-danger"
                    onClick={() => setDeleteTarget(log)}
                  >
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        body={t('confirm.deleteBody', { name: `${deleteTarget?.date} — ${deleteTarget?.weight_kg} kg` })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteLog.isPending}
      />
    </Container>
  )
}
