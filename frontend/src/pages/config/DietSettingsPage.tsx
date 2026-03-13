import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Spinner, Row, Col, Badge } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useDietSettings, useUpdateDietSettings } from '../../hooks/useDietSettings'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { DietSettingsUpdate } from '../../types/dietSettings'

const DEFAULTS: DietSettingsUpdate = {
  macro_tolerance_pct: 5,
  max_rebalance_iterations: 3,
}

export default function DietSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useDietSettings()
  const update = useUpdateDietSettings()

  const [form, setForm] = useState<DietSettingsUpdate>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm({ ...data })
  }, [data])

  const set = (field: keyof DietSettingsUpdate, value: number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await update.mutateAsync(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />

  return (
    <Container fluid>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="mb-0">{t('dietSettings.title')}</h4>
        {saved && <Badge bg="success" className="fs-6">{t('common.save')} ✓</Badge>}
      </div>

      <Row>
        <Col md={6} lg={5}>
          <Card>
            <Card.Header className="fw-semibold">{t('dietSettings.generatorSection')}</Card.Header>
            <Card.Body>
              {update.error && <ErrorAlert error={update.error} />}
              <Form onSubmit={handleSubmit}>

                {/* Macro Tolerance */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    {t('dietSettings.macroTolerance')}
                    <span className="text-muted fw-normal ms-2">(%)</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min={1} max={20} step={0.5}
                    value={form.macro_tolerance_pct}
                    onChange={e => set('macro_tolerance_pct', Number(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    {t('dietSettings.macroToleranceDesc')}
                  </Form.Text>
                </Form.Group>

                {/* Max Rebalance Iterations */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    {t('dietSettings.maxIterations')}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min={1} max={10} step={1}
                    value={form.max_rebalance_iterations}
                    onChange={e => set('max_rebalance_iterations', Number(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    {t('dietSettings.maxIterationsDesc')}
                  </Form.Text>
                </Form.Group>

                <Button type="submit" variant="primary" disabled={update.isPending}>
                  {update.isPending && <Spinner size="sm" animation="border" className="me-1" />}
                  {t('common.save')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
