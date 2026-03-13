import { useState } from 'react'
import {
  Container, Tabs, Tab, Table, Button, Modal, Form, Row, Col,
  Badge, Spinner, Accordion, InputGroup, Alert,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useDishes, useCreateDish, useUpdateDish, useDeleteDish } from '../../hooks/useDishes'
import { useIngredients, useCreateIngredient, useAiLookup } from '../../hooks/useIngredients'
import { useMealPlans, useGenerateMealPlan, useDeleteMealPlan } from '../../hooks/useMealPlans'
import { useProfile } from '../../context/ProfileContext'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { Dish, DishCreate, DishType, DishUpdate } from '../../types/dish'
import type { Ingredient, IngredientCreate } from '../../types/ingredient'
import type { Slot, Day } from '../../types/profile'

const SLOTS: Slot[] = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner']
const DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DISH_TYPES: DishType[] = ['primary', 'secondary', 'side']

const defaultDish: DishCreate = {
  name: '', dish_type: 'primary', meal_slots: [],
  variable_portions: false, ingredients: [],
}

// ── Dish Modal ───────────────────────────────────────────────────────────────

function DishModal({
  show, onHide, initial,
}: { show: boolean; onHide: () => void; initial: Dish | null }) {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()
  const create = useCreateDish()
  const update = useUpdateDish()
  const { data: allIngredients = [] } = useIngredients()

  const [form, setForm] = useState<DishCreate>(() =>
    initial ? {
      name: initial.name,
      dish_type: initial.dish_type,
      max_per_week: initial.max_per_week ?? undefined,
      profile_id: initial.profile_id ?? undefined,
      meal_slots: initial.meal_slots,
      variable_portions: initial.variable_portions,
      day_preferences: initial.day_preferences ?? [],
      preparation: initial.preparation ?? '',
      ingredients: initial.dish_ingredients.map(di => ({
        ingredient_id: di.ingredient_id,
        quantity_g: di.quantity_g,
      })),
    } : { ...defaultDish, profile_id: activeProfile?.id ?? undefined }
  )

  const [ingSearch, setIngSearch]       = useState('')
  const [addIngId, setAddIngId]         = useState<number | ''>('')
  const [addIngQty, setAddIngQty]       = useState<number>(100)
  const [showIngDropdown, setShowIngDropdown] = useState(false)

  const set = (field: keyof DishCreate, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleSlot = (slot: Slot) => {
    const current = form.meal_slots
    set('meal_slots', current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot])
  }

  const toggleDay = (day: Day) => {
    const current = form.day_preferences ?? []
    set('day_preferences', current.includes(day) ? current.filter(d => d !== day) : [...current, day])
  }

  const selectIngredient = (ing: Ingredient) => {
    setIngSearch(ing.name)
    setAddIngId(ing.id)
    setShowIngDropdown(false)
  }

  const addIngredient = () => {
    if (!addIngId) return
    if (!form.ingredients.some(i => i.ingredient_id === addIngId)) {
      set('ingredients', [...form.ingredients, { ingredient_id: Number(addIngId), quantity_g: addIngQty }])
    }
    setAddIngId('')
    setAddIngQty(100)
    setIngSearch('')
  }

  const removeIngredient = (id: number) =>
    set('ingredients', form.ingredients.filter(i => i.ingredient_id !== id))

  const handleSubmit = async () => {
    if (initial) {
      const upd: DishUpdate = {
        name: form.name, dish_type: form.dish_type,
        max_per_week: form.max_per_week ?? null,
        profile_id: form.profile_id ?? null,
        meal_slots: form.meal_slots, variable_portions: form.variable_portions,
        day_preferences: form.day_preferences ?? null,
        preparation: form.preparation ?? null,
      }
      await update.mutateAsync({ id: initial.id, data: upd })
    } else {
      await create.mutateAsync(form)
    }
    onHide()
  }

  const filteredIngredients = ingSearch.trim()
    ? allIngredients.filter(i =>
        i.name.toLowerCase().includes(ingSearch.toLowerCase()) &&
        !form.ingredients.some(fi => fi.ingredient_id === i.id)
      ).slice(0, 10)
    : []
  const isPending = create.isPending || update.isPending
  const error = create.error || update.error

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? t('meals.editDish') : t('meals.newDish')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <ErrorAlert error={error} />}
        <Row className="g-3">
          {/* Name */}
          <Col md={5}>
            <Form.Group>
              <Form.Label>{t('common.name')} *</Form.Label>
              <Form.Control value={form.name} onChange={e => set('name', e.target.value)} />
            </Form.Group>
          </Col>
          {/* Dish type */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>{t('meals.dishType')}</Form.Label>
              <Form.Select value={form.dish_type} onChange={e => set('dish_type', e.target.value as DishType)}>
                {DISH_TYPES.map(dt => (
                  <option key={dt} value={dt}>{t(`meals.${dt}`)}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          {/* Max per week */}
          <Col md={2}>
            <Form.Group>
              <Form.Label>{t('meals.maxPerWeek')}</Form.Label>
              <Form.Control
                type="number" min={1}
                placeholder={t('meals.unlimited')}
                value={form.max_per_week ?? ''}
                onChange={e => set('max_per_week', e.target.value ? Number(e.target.value) : null)}
              />
            </Form.Group>
          </Col>
          {/* Variable portions */}
          <Col md={2} className="d-flex align-items-end">
            <Form.Check
              type="checkbox"
              label={t('meals.variablePortions')}
              checked={form.variable_portions}
              onChange={e => set('variable_portions', e.target.checked)}
            />
          </Col>
          {/* Meal slots */}
          <Col md={12}>
            <Form.Label>{t('meals.mealSlots')} *</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {SLOTS.map(slot => (
                <Form.Check
                  key={slot} inline type="checkbox"
                  id={`slot-${slot}`}
                  label={t(`meals.slots.${slot}`)}
                  checked={form.meal_slots.includes(slot)}
                  onChange={() => toggleSlot(slot)}
                />
              ))}
            </div>
          </Col>
          {/* Day preferences */}
          <Col md={12}>
            <Form.Label>{t('meals.dayPreferences')}</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {DAYS.map(day => (
                <Form.Check
                  key={day} inline type="checkbox"
                  id={`day-${day}`}
                  label={t(`meals.days.${day}`)}
                  checked={(form.day_preferences ?? []).includes(day)}
                  onChange={() => toggleDay(day)}
                />
              ))}
            </div>
          </Col>
          {/* Preparation */}
          <Col md={12}>
            <Form.Group>
              <Form.Label>{t('meals.preparation')}</Form.Label>
              <Form.Control
                as="textarea" rows={3}
                value={form.preparation ?? ''}
                onChange={e => set('preparation', e.target.value)}
              />
            </Form.Group>
          </Col>

          {/* Ingredients */}
          <Col md={12}>
            <hr />
            <h6>{t('meals.ingredients')}</h6>
            <Table size="sm" bordered className="mb-2">
              <thead><tr><th>{t('common.name')}</th><th>{t('meals.quantityG')}</th><th></th></tr></thead>
              <tbody>
                {form.ingredients.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-muted small">{t('meals.noIngredients')}</td></tr>
                )}
                {form.ingredients.map(fi => {
                  const ing = allIngredients.find(i => i.id === fi.ingredient_id)
                  return (
                    <tr key={fi.ingredient_id}>
                      <td>{ing?.name ?? fi.ingredient_id}</td>
                      <td>{fi.quantity_g} g</td>
                      <td>
                        <Button size="sm" variant="outline-danger" onClick={() => removeIngredient(fi.ingredient_id)}>
                          ×
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            {/* Add ingredient row — autocomplete dropdown */}
            <div className="position-relative">
              <InputGroup size="sm">
                <Form.Control
                  placeholder={t('meals.ingredientSearch')}
                  value={ingSearch}
                  autoComplete="off"
                  onChange={e => {
                    setIngSearch(e.target.value)
                    setAddIngId('')
                    setShowIngDropdown(true)
                  }}
                  onFocus={() => ingSearch.trim() && setShowIngDropdown(true)}
                  onBlur={() => setTimeout(() => setShowIngDropdown(false), 150)}
                />
                <Form.Control
                  type="number" min={1} step={1}
                  placeholder="g"
                  value={addIngQty}
                  onChange={e => setAddIngQty(Number(e.target.value))}
                  style={{ maxWidth: 110 }}
                />
                <Button
                  variant="outline-primary"
                  onClick={addIngredient}
                  disabled={!addIngId}
                >
                  {t('common.add')}
                </Button>
              </InputGroup>

              {showIngDropdown && filteredIngredients.length > 0 && (
                <div
                  className="position-absolute w-100 border rounded bg-white shadow-sm"
                  style={{ zIndex: 1050, bottom: '100%', maxHeight: 220, overflowY: 'auto' }}
                >
                  {filteredIngredients.map(i => (
                    <div
                      key={i.id}
                      className="px-3 py-2 border-bottom"
                      style={{ cursor: 'pointer' }}
                      onMouseDown={() => selectIngredient(i)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <span className="fw-semibold">{i.name}</span>
                      <small className="text-muted ms-2">{i.kcal_per_100g} kcal/100g</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t('common.cancel')}</Button>
        <Button
          variant="primary" onClick={handleSubmit}
          disabled={isPending || !form.name || form.meal_slots.length === 0}
        >
          {isPending && <Spinner size="sm" animation="border" className="me-1" />}
          {t('common.save')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ── Dish from Ingredient Modal ───────────────────────────────────────────────

function DishFromIngredientModal({
  show, onHide,
}: { show: boolean; onHide: () => void }) {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()
  const createDish = useCreateDish()
  const createIng  = useCreateIngredient()
  const aiLookup   = useAiLookup()
  const { data: allIngredients = [] } = useIngredients()

  // ── ingredient search
  const [ingSearch, setIngSearch]       = useState('')
  const [selectedIng, setSelectedIng]   = useState<Ingredient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [qty, setQty]                   = useState<number>(100)
  const [aiPreview, setAiPreview]       = useState<IngredientCreate | null>(null)

  // ── dish fields
  const [dishType, setDishType]           = useState<DishType>('primary')
  const [maxPerWeek, setMaxPerWeek]       = useState<number | undefined>(undefined)
  const [varPortions, setVarPortions]     = useState(false)
  const [mealSlots, setMealSlots]         = useState<Slot[]>([])
  const [dayPrefs, setDayPrefs]           = useState<Day[]>([])

  const filtered = ingSearch.trim()
    ? allIngredients
        .filter(i => i.name.toLowerCase().includes(ingSearch.toLowerCase()))
        .slice(0, 10)
    : []

  const selectIngredient = (ing: Ingredient) => {
    setSelectedIng(ing)
    setIngSearch(ing.name)
    setAiPreview(null)
    setShowDropdown(false)
  }

  const handleAi = async () => {
    const result = await aiLookup.mutateAsync(ingSearch.trim())
    setAiPreview({
      name: result.name, unit: result.unit,
      kcal_per_100g: result.kcal_per_100g, proteins_g: result.proteins_g,
      carbs_g: result.carbs_g, fats_g: result.fats_g,
      seasonality_months: null,
    })
    setSelectedIng(null)
  }

  const handleConfirmAi = async () => {
    if (!aiPreview) return
    const created = await createIng.mutateAsync(aiPreview)
    setSelectedIng(created)
    setIngSearch(created.name)
    setAiPreview(null)
  }

  const toggleSlot = (slot: Slot) =>
    setMealSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])

  const toggleDay = (day: Day) =>
    setDayPrefs(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

  const handleSubmit = async () => {
    if (!selectedIng) return
    await createDish.mutateAsync({
      name: selectedIng.name,
      dish_type: dishType,
      max_per_week: maxPerWeek ?? null,
      profile_id: activeProfile?.id,
      meal_slots: mealSlots,
      variable_portions: varPortions,
      day_preferences: dayPrefs,
      ingredients: [{ ingredient_id: selectedIng.id, quantity_g: qty }],
    } as DishCreate)
    onHide()
  }

  const isPending = createDish.isPending || createIng.isPending
  const error     = createDish.error || createIng.error || aiLookup.error

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('meals.newDishFromIngredientTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <ErrorAlert error={error} />}

        {/* ── Ingredient search ── */}
        <Form.Label className="fw-semibold">{t('meals.ingredients')} *</Form.Label>
        <div className="position-relative mb-2">
          <InputGroup>
            <Form.Control
              placeholder={t('meals.ingredientSearch')}
              value={ingSearch}
              autoComplete="off"
              onChange={e => {
                setIngSearch(e.target.value)
                setSelectedIng(null)
                setAiPreview(null)
                setShowDropdown(true)
              }}
              onFocus={() => ingSearch.trim() && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            <Form.Control
              type="number" min={1} step={1}
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              style={{ maxWidth: 90 }}
              title={t('meals.quantityG')}
            />
            <Button
              variant={selectedIng ? 'outline-success' : 'outline-primary'}
              disabled={aiLookup.isPending || !ingSearch.trim()}
              onClick={handleAi}
              title={t('ingredients.aiLookupSearch')}
            >
              {aiLookup.isPending
                ? <Spinner size="sm" animation="border" />
                : selectedIng ? '✓ AI' : '🤖 AI'}
            </Button>
          </InputGroup>

          {/* autocomplete dropdown */}
          {showDropdown && filtered.length > 0 && (
            <div
              className="position-absolute w-100 border rounded bg-white shadow-sm"
              style={{ zIndex: 1050, bottom: '100%', maxHeight: 200, overflowY: 'auto' }}
            >
              {filtered.map(i => (
                <div
                  key={i.id}
                  className="px-3 py-2 border-bottom"
                  style={{ cursor: 'pointer' }}
                  onMouseDown={() => selectIngredient(i)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span className="fw-semibold">{i.name}</span>
                  <small className="text-muted ms-2">{i.kcal_per_100g} kcal/100g · P {i.proteins_g}g C {i.carbs_g}g F {i.fats_g}g</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* selected badge */}
        {selectedIng && (
          <Alert variant="success" className="py-2 small mb-3">
            ✓ <strong>{selectedIng.name}</strong> — {selectedIng.kcal_per_100g} kcal/100g ·
            P {selectedIng.proteins_g}g · C {selectedIng.carbs_g}g · F {selectedIng.fats_g}g · {qty}g
          </Alert>
        )}

        {/* AI preview */}
        {aiPreview && !selectedIng && (
          <Alert variant="info" className="py-2 small mb-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                🤖 <strong>{aiPreview.name}</strong> — {aiPreview.kcal_per_100g} kcal/100g ·
                P {aiPreview.proteins_g}g · C {aiPreview.carbs_g}g · F {aiPreview.fats_g}g
              </div>
              <div className="d-flex gap-2 ms-3 flex-shrink-0">
                <Button size="sm" variant="info" onClick={handleConfirmAi} disabled={createIng.isPending}>
                  {createIng.isPending
                    ? <Spinner size="sm" animation="border" />
                    : t('meals.createAndUse')}
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setAiPreview(null)}>×</Button>
              </div>
            </div>
          </Alert>
        )}

        <Row className="g-3 mt-1">
          {/* Dish type */}
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('meals.dishType')}</Form.Label>
              <Form.Select value={dishType} onChange={e => setDishType(e.target.value as DishType)}>
                {DISH_TYPES.map(dt => (
                  <option key={dt} value={dt}>{t(`meals.${dt}`)}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          {/* Max per week */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>{t('meals.maxPerWeek')}</Form.Label>
              <Form.Control
                type="number" min={1}
                placeholder={t('meals.unlimited')}
                value={maxPerWeek ?? ''}
                onChange={e => setMaxPerWeek(e.target.value ? Number(e.target.value) : undefined)}
              />
            </Form.Group>
          </Col>
          {/* Variable portions */}
          <Col md={5} className="d-flex align-items-end">
            <Form.Check
              type="checkbox"
              label={t('meals.variablePortions')}
              checked={varPortions}
              onChange={e => setVarPortions(e.target.checked)}
            />
          </Col>
          {/* Meal slots */}
          <Col md={12}>
            <Form.Label>{t('meals.mealSlots')} *</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {SLOTS.map(slot => (
                <Form.Check
                  key={slot} inline type="checkbox" id={`fis-slot-${slot}`}
                  label={t(`meals.slots.${slot}`)}
                  checked={mealSlots.includes(slot)}
                  onChange={() => toggleSlot(slot)}
                />
              ))}
            </div>
          </Col>
          {/* Day preferences */}
          <Col md={12}>
            <Form.Label>{t('meals.dayPreferences')}</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {DAYS.map(day => (
                <Form.Check
                  key={day} inline type="checkbox" id={`fis-day-${day}`}
                  label={t(`meals.days.${day}`)}
                  checked={dayPrefs.includes(day)}
                  onChange={() => toggleDay(day)}
                />
              ))}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t('common.cancel')}</Button>
        <Button
          variant="primary" onClick={handleSubmit}
          disabled={isPending || !selectedIng || mealSlots.length === 0}
        >
          {isPending && <Spinner size="sm" animation="border" className="me-1" />}
          {t('common.save')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ── Dish Library Tab ─────────────────────────────────────────────────────────

function DishLibraryTab() {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()
  const [filterType, setFilterType] = useState('')
  const [filterSlot, setFilterSlot] = useState('')

  const { data: dishes = [], isLoading, error } = useDishes({
    dish_type: filterType || undefined,
    slot: filterSlot || undefined,
    profile_id: activeProfile?.id,
  })
  const deleteDish = useDeleteDish()
  const [showModal, setShowModal]           = useState(false)
  const [showFromIngModal, setShowFromIngModal] = useState(false)
  const [editTarget, setEditTarget]         = useState<Dish | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<Dish | null>(null)

  const openCreate = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (d: Dish) => { setEditTarget(d); setShowModal(true) }

  return (
    <>
      <Row className="g-2 mb-3">
        <Col md={3}>
          <Form.Select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">{t('meals.dishType')}: {t('common.all')}</option>
            {DISH_TYPES.map(dt => (
              <option key={dt} value={dt}>{t(`meals.${dt}`)}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
            <option value="">{t('meals.mealSlots')}: {t('common.all')}</option>
            {SLOTS.map(s => (
              <option key={s} value={s}>{t(`meals.slots.${s}`)}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md="auto" className="ms-auto d-flex gap-2">
          <Button size="sm" variant="outline-primary" onClick={() => setShowFromIngModal(true)}>
            + {t('meals.newDishFromIngredient')}
          </Button>
          <Button size="sm" variant="primary" onClick={openCreate}>
            + {t('meals.newDish')}
          </Button>
        </Col>
      </Row>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}

      {!isLoading && !error && (
        <Table striped hover responsive size="sm">
          <thead className="table-light">
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('meals.dishType')}</th>
              <th>{t('meals.mealSlots')}</th>
              <th>{t('meals.maxPerWeek')}</th>
              <th>{t('meals.variablePortions')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {dishes.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted">{t('common.noData')}</td></tr>
            )}
            {dishes.map(dish => (
              <tr key={dish.id}>
                <td>{dish.name}</td>
                <td>
                  <Badge bg={dish.dish_type === 'primary' ? 'primary' : dish.dish_type === 'secondary' ? 'info' : 'secondary'}>
                    {t(`meals.${dish.dish_type}`)}
                  </Badge>
                </td>
                <td>
                  {dish.meal_slots.map(s => (
                    <Badge key={s} bg="light" text="dark" className="me-1 border">{t(`meals.slots.${s}`)}</Badge>
                  ))}
                </td>
                <td>{dish.max_per_week ?? t('meals.unlimited')}</td>
                <td>{dish.variable_portions ? '✓' : '—'}</td>
                <td>
                  <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEdit(dish)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(dish)}>
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {showModal && (
        <DishModal show={showModal} onHide={() => setShowModal(false)} initial={editTarget} />
      )}

      {showFromIngModal && (
        <DishFromIngredientModal show={showFromIngModal} onHide={() => setShowFromIngModal(false)} />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        body={t('confirm.deleteBody', { name: deleteTarget?.name ?? '' })}
        onConfirm={async () => {
          if (deleteTarget) { await deleteDish.mutateAsync(deleteTarget.id); setDeleteTarget(null) }
        }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteDish.isPending}
      />
    </>
  )
}

// ── Weekly Plans Tab ─────────────────────────────────────────────────────────

function WeeklyPlansTab() {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()
  const { data: plans = [], isLoading, error } = useMealPlans(activeProfile?.id ?? null)
  const generate = useGenerateMealPlan()
  const deletePlan = useDeleteMealPlan()

  const [weekStart, setWeekStart] = useState<string>(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return monday.toISOString().split('T')[0]
  })
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  if (!activeProfile) {
    return <Alert variant="info">{t('meals.selectProfile')}</Alert>
  }

  const handleGenerate = async () => {
    await generate.mutateAsync({ profile_id: activeProfile.id, week_start_date: weekStart })
  }

  return (
    <>
      {generate.error && <ErrorAlert error={generate.error} />}
      <Row className="g-2 mb-3 align-items-center">
        <Col md="auto">
          <Form.Control
            type="date"
            value={weekStart}
            onChange={e => setWeekStart(e.target.value)}
          />
        </Col>
        <Col md="auto">
          <Button
            variant="primary" size="sm"
            onClick={handleGenerate}
            disabled={generate.isPending}
          >
            {generate.isPending
              ? <><Spinner size="sm" animation="border" className="me-1" />{t('meals.generating')}</>
              : t('meals.generatePlan')}
          </Button>
        </Col>
      </Row>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}

      {!isLoading && plans.length === 0 && (
        <p className="text-muted">{t('meals.noPlans')}</p>
      )}

      <Accordion>
        {plans.map(plan => (
          <Accordion.Item key={plan.id} eventKey={String(plan.id)}>
            <Accordion.Header>
              {t('meals.weekOf')} {plan.week_start_date}
              <Button
                size="sm" variant="outline-danger" className="ms-3"
                onClick={e => { e.stopPropagation(); setDeleteTarget(plan.id) }}
              >
                {t('common.delete')}
              </Button>
            </Accordion.Header>
            <Accordion.Body className="p-0">
              <div style={{ overflowX: 'auto' }}>
                <Table size="sm" bordered className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 120 }}>{t('meals.mealSlots')}</th>
                      {plan.daily_plans.map(dp => (
                        <th key={dp.id} style={{ minWidth: 130 }}>
                          {new Date(dp.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(slot => (
                      <tr key={slot}>
                        <td className="fw-semibold small bg-light">{t(`meals.slots.${slot}`)}</td>
                        {plan.daily_plans.map(dp => {
                          const meal = dp.meals.find(m => m.slot === slot)
                          return (
                            <td key={dp.id} className="small">
                              {meal?.dish ? (
                                <>
                                  <div>{meal.dish.name}</div>
                                  {meal.kcal && (
                                    <span className="text-muted">{meal.kcal.toFixed(0)} {t('meals.kcal')}</span>
                                  )}
                                </>
                              ) : t('meals.empty')}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      <ConfirmModal
        show={deleteTarget !== null}
        body={t('confirm.deleteBody', { name: `plan #${deleteTarget}` })}
        onConfirm={async () => {
          if (deleteTarget !== null) { await deletePlan.mutateAsync(deleteTarget); setDeleteTarget(null) }
        }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deletePlan.isPending}
      />
    </>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MealsPage() {
  const { t } = useTranslation()
  return (
    <Container fluid>
      <h4 className="mb-3">{t('meals.title')}</h4>
      <Tabs defaultActiveKey="library" className="mb-3">
        <Tab eventKey="library" title={t('meals.dishLibrary')}>
          <DishLibraryTab />
        </Tab>
        <Tab eventKey="plans" title={t('meals.weeklyPlans')}>
          <WeeklyPlansTab />
        </Tab>
      </Tabs>
    </Container>
  )
}
