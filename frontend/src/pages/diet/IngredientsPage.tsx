import { useState, useEffect } from 'react'
import {
  Container, Table, Button, Modal, Form, Row, Col,
  Badge, Spinner, InputGroup,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import {
  useIngredients, useCreateIngredient, useUpdateIngredient,
  useDeleteIngredient, useAiLookup,
} from '../../hooks/useIngredients'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { Ingredient, IngredientCreate } from '../../types/ingredient'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

const defaultForm: IngredientCreate = {
  name: '', unit: 'g', kcal_per_100g: 0, proteins_g: 0, carbs_g: 0, fats_g: 0,
  seasonality_months: null,
}

// ── Ingredient Modal ─────────────────────────────────────────────────────────

function IngredientModal({
  show, onHide, initial,
}: { show: boolean; onHide: () => void; initial: Ingredient | null }) {
  const { t } = useTranslation()
  const create = useCreateIngredient()
  const update = useUpdateIngredient()
  const aiLookup = useAiLookup()

  const [form, setForm] = useState<IngredientCreate>(
    initial
      ? { name: initial.name, unit: initial.unit, kcal_per_100g: initial.kcal_per_100g,
          proteins_g: initial.proteins_g, carbs_g: initial.carbs_g, fats_g: initial.fats_g,
          seasonality_months: initial.seasonality_months ?? null }
      : defaultForm
  )
  const [aiName, setAiName] = useState('')
  const [showAi, setShowAi] = useState(false)
  const [allYear, setAllYear] = useState(!initial?.seasonality_months)

  const set = (field: keyof IngredientCreate, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleAiLookup = async () => {
    const result = await aiLookup.mutateAsync(aiName || form.name)
    setForm(prev => ({
      ...prev,
      name: result.name,
      unit: result.unit,
      kcal_per_100g: result.kcal_per_100g,
      proteins_g: result.proteins_g,
      carbs_g: result.carbs_g,
      fats_g: result.fats_g,
    }))
    setShowAi(false)
  }

  const toggleMonth = (m: number) => {
    const current = form.seasonality_months ?? []
    if (current.includes(m)) {
      set('seasonality_months', current.filter(x => x !== m))
    } else {
      set('seasonality_months', [...current, m].sort((a, b) => a - b))
    }
  }

  const handleSubmit = async () => {
    const payload = { ...form, seasonality_months: allYear ? null : form.seasonality_months }
    if (initial) {
      await update.mutateAsync({ id: initial.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    onHide()
  }

  const isPending = create.isPending || update.isPending
  const error = create.error || update.error

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? t('ingredients.editIngredient') : t('ingredients.newIngredient')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <ErrorAlert error={error} />}

        {/* AI Lookup sub-section */}
        <div className="border rounded p-3 mb-3 bg-light">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong className="small">{t('ingredients.aiLookupTitle')}</strong>
            <Button size="sm" variant="outline-secondary" onClick={() => setShowAi(!showAi)}>
              {t('ingredients.aiLookup')}
            </Button>
          </div>
          {showAi && (
            <>
              <p className="text-muted small mb-2">{t('ingredients.aiLookupDescription')}</p>
              <InputGroup size="sm">
                <Form.Control
                  placeholder={form.name || t('ingredients.aiLookupIngredientName')}
                  value={aiName}
                  onChange={e => setAiName(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={handleAiLookup}
                  disabled={aiLookup.isPending}
                >
                  {aiLookup.isPending
                    ? <Spinner size="sm" animation="border" />
                    : t('ingredients.aiLookupSearch')}
                </Button>
              </InputGroup>
              {aiLookup.error && <ErrorAlert error={aiLookup.error} />}
            </>
          )}
        </div>

        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>{t('ingredients.name')} *</Form.Label>
              <Form.Control value={form.name} onChange={e => set('name', e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>{t('ingredients.unit')}</Form.Label>
              <Form.Control value={form.unit} onChange={e => set('unit', e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>{t('ingredients.kcalPer100g')}</Form.Label>
              <Form.Control type="number" step="0.1" min={0} value={form.kcal_per_100g}
                onChange={e => set('kcal_per_100g', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('ingredients.proteinsPer100g')}</Form.Label>
              <Form.Control type="number" step="0.1" min={0} value={form.proteins_g}
                onChange={e => set('proteins_g', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('ingredients.carbsPer100g')}</Form.Label>
              <Form.Control type="number" step="0.1" min={0} value={form.carbs_g}
                onChange={e => set('carbs_g', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('ingredients.fatsPer100g')}</Form.Label>
              <Form.Control type="number" step="0.1" min={0} value={form.fats_g}
                onChange={e => set('fats_g', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Label>{t('ingredients.seasonality')}</Form.Label>
            <Form.Check
              type="checkbox"
              label={t('ingredients.allYear')}
              checked={allYear}
              onChange={e => {
                setAllYear(e.target.checked)
                if (e.target.checked) set('seasonality_months', null)
                else set('seasonality_months', MONTHS)
              }}
              className="mb-2"
            />
            {!allYear && (
              <div className="d-flex flex-wrap gap-1">
                {MONTHS.map(m => (
                  <Form.Check
                    key={m}
                    inline
                    type="checkbox"
                    id={`month-${m}`}
                    label={t(`ingredients.months.${m}`)}
                    checked={form.seasonality_months?.includes(m) ?? false}
                    onChange={() => toggleMonth(m)}
                  />
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t('common.cancel')}</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isPending || !form.name}>
          {isPending && <Spinner size="sm" animation="border" className="me-1" />}
          {t('common.save')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [month, setMonth] = useState<number | undefined>(undefined)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: ingredients = [], isLoading, error } = useIngredients(debouncedSearch, month)
  const deleteIngredient = useDeleteIngredient()

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)

  const openCreate = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (ing: Ingredient) => { setEditTarget(ing); setShowModal(true) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteIngredient.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Container fluid>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">{t('ingredients.title')}</h4>
        <Button variant="primary" size="sm" onClick={openCreate}>
          {t('ingredients.newIngredient')}
        </Button>
      </div>

      {/* Filters */}
      <Row className="g-2 mb-3">
        <Col md={5}>
          <Form.Control
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={month ?? ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">{t('ingredients.filterByMonth')}</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{t(`ingredients.months.${m}`)}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}

      {!isLoading && !error && (
        <Table striped hover responsive size="sm">
          <thead className="table-light">
            <tr>
              <th>{t('ingredients.name')}</th>
              <th>{t('ingredients.unit')}</th>
              <th>{t('ingredients.kcalPer100g')}</th>
              <th>{t('ingredients.proteinsPer100g')}</th>
              <th>{t('ingredients.carbsPer100g')}</th>
              <th>{t('ingredients.fatsPer100g')}</th>
              <th>{t('ingredients.seasonality')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted">{t('common.noData')}</td></tr>
            )}
            {ingredients.map(ing => (
              <tr key={ing.id}>
                <td>{ing.name}</td>
                <td>{ing.unit}</td>
                <td>{ing.kcal_per_100g}</td>
                <td>{ing.proteins_g}</td>
                <td>{ing.carbs_g}</td>
                <td>{ing.fats_g}</td>
                <td>
                  {ing.seasonality_months
                    ? ing.seasonality_months.map(m => (
                        <Badge key={m} bg="secondary" className="me-1" style={{ fontSize: 10 }}>
                          {t(`ingredients.months.${m}`)}
                        </Badge>
                      ))
                    : <Badge bg="success" style={{ fontSize: 10 }}>{t('ingredients.allYear')}</Badge>
                  }
                </td>
                <td>
                  <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEdit(ing)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(ing)}>
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showModal && (
        <IngredientModal show={showModal} onHide={() => setShowModal(false)} initial={editTarget} />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        body={t('confirm.deleteBody', { name: deleteTarget?.name ?? '' })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteIngredient.isPending}
      />
    </Container>
  )
}
