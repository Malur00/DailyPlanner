import { useState } from 'react'
import {
  Container, Row, Col, Card, Button, Badge, Modal, Form,
  Table, Spinner, Tabs, Tab,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import {
  useProfiles, useCreateProfile, useUpdateProfile,
  useDeleteProfile, useProfileGoal, useUpsertGoal,
} from '../../hooks/useProfiles'
import { useProfile } from '../../context/ProfileContext'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { SumValidator } from '../../components/common/SumValidator'
import type { Profile, ProfileCreate, ProfileGoalCreate } from '../../types/profile'

const defaultProfile: ProfileCreate = {
  name: '', gender: 'male', age: 30, weight_kg: 70, height_cm: 175,
  goal: 'maintenance', activity_level: 'moderate', calc_formula: 'mifflin',
}

const defaultGoal: ProfileGoalCreate = {
  meal_dist_breakfast_pct: 15,
  meal_dist_morning_snack_pct: 10,
  meal_dist_lunch_pct: 40,
  meal_dist_afternoon_snack_pct: 5,
  meal_dist_dinner_pct: 30,
  macro_carbs_pct: 50,
  macro_proteins_pct: 20,
  macro_fats_pct: 30,
}

// ── Profile Modal ────────────────────────────────────────────────────────────

function ProfileModal({
  show, onHide, initial,
}: {
  show: boolean
  onHide: () => void
  initial: Profile | null
}) {
  const { t } = useTranslation()
  const create = useCreateProfile()
  const update = useUpdateProfile()
  const [form, setForm] = useState<ProfileCreate>(initial ?? defaultProfile)

  const set = (field: keyof ProfileCreate, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (initial) {
      await update.mutateAsync({ id: initial.id, data: form })
    } else {
      await create.mutateAsync(form)
    }
    onHide()
  }

  const isPending = create.isPending || update.isPending
  const error = create.error || update.error

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? t('profiles.editProfile') : t('profiles.newProfile')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <ErrorAlert error={error} />}
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>{t('profiles.name')} *</Form.Label>
              <Form.Control value={form.name} onChange={e => set('name', e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>{t('profiles.gender')}</Form.Label>
              <Form.Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">{t('profiles.male')}</option>
                <option value="female">{t('profiles.female')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>{t('profiles.age')}</Form.Label>
              <Form.Control type="number" min={1} value={form.age}
                onChange={e => set('age', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.weightKg')}</Form.Label>
              <Form.Control type="number" step="0.1" min={1} value={form.weight_kg}
                onChange={e => set('weight_kg', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.heightCm')}</Form.Label>
              <Form.Control type="number" step="0.1" min={1} value={form.height_cm}
                onChange={e => set('height_cm', Number(e.target.value))} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.bodyFatPct')}</Form.Label>
              <Form.Control type="number" step="0.1" min={0} max={100}
                value={form.body_fat_pct ?? ''}
                onChange={e => set('body_fat_pct', e.target.value ? Number(e.target.value) : null)} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.goal')}</Form.Label>
              <Form.Select value={form.goal} onChange={e => set('goal', e.target.value)}>
                <option value="weight_loss">{t('profiles.goalWeightLoss')}</option>
                <option value="maintenance">{t('profiles.goalMaintenance')}</option>
                <option value="mass">{t('profiles.goalMass')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.activityLevel')}</Form.Label>
              <Form.Select value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                <option value="sedentary">{t('profiles.sedentary')}</option>
                <option value="light">{t('profiles.light')}</option>
                <option value="moderate">{t('profiles.moderate')}</option>
                <option value="intense">{t('profiles.intense')}</option>
                <option value="very_intense">{t('profiles.veryIntense')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.calcFormula')}</Form.Label>
              <Form.Select value={form.calc_formula} onChange={e => set('calc_formula', e.target.value)}>
                <option value="mifflin">{t('profiles.mifflin')}</option>
                <option value="harris">{t('profiles.harris')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.bodyStructure')}</Form.Label>
              <Form.Select value={form.body_structure ?? ''}
                onChange={e => set('body_structure', e.target.value || null)}>
                <option value="">{t('common.none')}</option>
                <option value="ectomorph">{t('profiles.ectomorph')}</option>
                <option value="mesomorph">{t('profiles.mesomorph')}</option>
                <option value="endomorph">{t('profiles.endomorph')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('profiles.weighDay')}</Form.Label>
              <Form.Select value={form.weigh_day ?? ''}
                onChange={e => set('weigh_day', e.target.value || null)}>
                <option value="">{t('common.none')}</option>
                {['mon','tue','wed','thu','fri','sat','sun'].map(d => (
                  <option key={d} value={d}>{t(`meals.days.${d}`)}</option>
                ))}
              </Form.Select>
            </Form.Group>
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

// ── Goal Modal ───────────────────────────────────────────────────────────────

function GoalModal({ show, onHide, profile }: { show: boolean; onHide: () => void; profile: Profile }) {
  const { t } = useTranslation()
  const { data: existingGoal } = useProfileGoal(profile.id)
  const upsert = useUpsertGoal()

  const [form, setForm] = useState<ProfileGoalCreate>(() =>
    existingGoal ? {
      meal_dist_breakfast_pct: existingGoal.meal_dist_breakfast_pct,
      meal_dist_morning_snack_pct: existingGoal.meal_dist_morning_snack_pct,
      meal_dist_lunch_pct: existingGoal.meal_dist_lunch_pct,
      meal_dist_afternoon_snack_pct: existingGoal.meal_dist_afternoon_snack_pct,
      meal_dist_dinner_pct: existingGoal.meal_dist_dinner_pct,
      macro_carbs_pct: existingGoal.macro_carbs_pct,
      macro_proteins_pct: existingGoal.macro_proteins_pct,
      macro_fats_pct: existingGoal.macro_fats_pct,
    } : defaultGoal
  )

  const mealVals = [
    form.meal_dist_breakfast_pct, form.meal_dist_morning_snack_pct,
    form.meal_dist_lunch_pct, form.meal_dist_afternoon_snack_pct, form.meal_dist_dinner_pct,
  ]
  const macroVals = [form.macro_carbs_pct, form.macro_proteins_pct, form.macro_fats_pct]

  const handleSubmit = async () => {
    await upsert.mutateAsync({ id: profile.id, data: form })
    onHide()
  }

  const computed = existingGoal

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{t('profiles.goalTitle')} — {profile.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {upsert.error && <ErrorAlert error={upsert.error} />}

        <Tabs defaultActiveKey="meal" className="mb-3">
          {/* Tab A: Meal Distribution */}
          <Tab eventKey="meal" title={t('profiles.mealDistribution')}>
            <div className="d-flex align-items-center mb-2">
              <h6 className="mb-0">{t('profiles.mealDistribution')}</h6>
              <SumValidator values={mealVals} />
            </div>
            <Table size="sm" bordered>
              <thead><tr><th>{t('profiles.slot')}</th><th>%</th></tr></thead>
              <tbody>
                {([
                  ['meal_dist_breakfast_pct', 'profiles.breakfast'],
                  ['meal_dist_morning_snack_pct', 'profiles.morningSnack'],
                  ['meal_dist_lunch_pct', 'profiles.lunch'],
                  ['meal_dist_afternoon_snack_pct', 'profiles.afternoonSnack'],
                  ['meal_dist_dinner_pct', 'profiles.dinner'],
                ] as [keyof ProfileGoalCreate, string][]).map(([field, labelKey]) => (
                  <tr key={field}>
                    <td>{t(labelKey)}</td>
                    <td style={{ width: 120 }}>
                      <Form.Control
                        type="number" size="sm" min={0} max={100} step={0.5}
                        value={form[field] as number}
                        onChange={e => setForm(prev => ({ ...prev, [field]: Number(e.target.value) }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>

          {/* Tab B: Overall Macros */}
          <Tab eventKey="macros" title={t('profiles.overallMacros')}>
            <div className="d-flex align-items-center mb-2">
              <h6 className="mb-0">{t('profiles.overallMacros')}</h6>
              <SumValidator values={macroVals} />
            </div>
            <Table size="sm" bordered>
              <thead><tr><th>{t('common.name')}</th><th>%</th></tr></thead>
              <tbody>
                {([
                  ['macro_carbs_pct', 'profiles.carbs'],
                  ['macro_proteins_pct', 'profiles.proteins'],
                  ['macro_fats_pct', 'profiles.fats'],
                ] as [keyof ProfileGoalCreate, string][]).map(([field, labelKey]) => (
                  <tr key={field}>
                    <td>{t(labelKey)}</td>
                    <td style={{ width: 120 }}>
                      <Form.Control
                        type="number" size="sm" min={0} max={100} step={0.5}
                        value={form[field] as number}
                        onChange={e => setForm(prev => ({ ...prev, [field]: Number(e.target.value) }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>
        </Tabs>

        {/* Computed values panel — always visible when goal data is available */}
        {computed && (computed.bmr || computed.tdee || computed.kcal_target) && (
          <div className="p-3 bg-light rounded border mt-2">
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <span className="small"><span className="text-muted">BMR:</span> <strong>{computed.bmr?.toFixed(0) ?? '—'}</strong> kcal</span>
              <span className="small"><span className="text-muted">TDEE:</span> <strong>{computed.tdee?.toFixed(0) ?? '—'}</strong> kcal</span>
              <span className="small text-primary"><span className="text-muted">{t('profiles.kcalTarget')}:</span> <strong>{computed.kcal_target?.toFixed(0) ?? '—'}</strong> kcal</span>
              <span className="vr" />
              <span className="small"><span className="text-muted">{t('profiles.carbs')}:</span> {computed.carbs_g?.toFixed(0) ?? '—'} g</span>
              <span className="small"><span className="text-muted">{t('profiles.proteins')}:</span> {computed.proteins_g?.toFixed(0) ?? '—'} g</span>
              <span className="small"><span className="text-muted">{t('profiles.fats')}:</span> {computed.fats_g?.toFixed(0) ?? '—'} g</span>
            </div>
            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>{t('profiles.computedNote')}</div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t('common.cancel')}</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={upsert.isPending}>
          {upsert.isPending && <Spinner size="sm" animation="border" className="me-1" />}
          {t('common.save')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function UserProfilesPage() {
  const { t } = useTranslation()
  const { data: profiles = [], isLoading, error } = useProfiles()
  const deleteProfile = useDeleteProfile()
  const { setActiveProfileId, activeProfile } = useProfile()

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [goalTarget, setGoalTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  const openCreate = () => { setEditTarget(null); setShowProfileModal(true) }
  const openEdit = (p: Profile) => { setEditTarget(p); setShowProfileModal(true) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteProfile.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />

  return (
    <Container fluid>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="mb-0">{t('profiles.title')}</h4>
        <Button variant="primary" onClick={openCreate}>{t('profiles.newProfile')}</Button>
      </div>

      {profiles.length === 0 && (
        <p className="text-muted">{t('common.noData')}</p>
      )}

      <Row className="g-3">
        {profiles.map(profile => {
          const bmi = (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
          const isActive = activeProfile?.id === profile.id
          return (
            <Col key={profile.id} md={6} lg={4}>
              <Card border={isActive ? 'primary' : undefined} className={isActive ? 'shadow-sm' : ''}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title className="mb-1">{profile.name}</Card.Title>
                      <Badge bg={
                        profile.goal === 'weight_loss' ? 'info'
                        : profile.goal === 'mass' ? 'success' : 'secondary'
                      } className="me-1">
                        {t(`profiles.goal${profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1).replace('_', '')}` as never)}
                      </Badge>
                      {isActive && <Badge bg="primary">{t('dashboard.active')}</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 small text-muted">
                    <div>{t('profiles.weightKg')}: <strong>{profile.weight_kg} kg</strong></div>
                    <div>{t('profiles.bmi')}: <strong>{bmi}</strong></div>
                    <div>{t('profiles.activityLevel')}: {t(`profiles.${profile.activity_level === 'very_intense' ? 'veryIntense' : profile.activity_level}`)}</div>
                  </div>
                </Card.Body>
                <Card.Footer className="d-flex gap-2 flex-wrap">
                  {!isActive && (
                    <Button size="sm" variant="outline-primary" onClick={() => setActiveProfileId(profile.id)}>
                      {t('dashboard.setActive')}
                    </Button>
                  )}
                  <Button size="sm" variant="outline-secondary" onClick={() => openEdit(profile)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="outline-info" onClick={() => setGoalTarget(profile)}>
                    {t('profiles.configureGoal')}
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(profile)}>
                    {t('common.delete')}
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* Profile create/edit modal */}
      {showProfileModal && (
        <ProfileModal
          show={showProfileModal}
          onHide={() => setShowProfileModal(false)}
          initial={editTarget}
        />
      )}

      {/* Goal config modal */}
      {goalTarget && (
        <GoalModal
          show={!!goalTarget}
          onHide={() => setGoalTarget(null)}
          profile={goalTarget}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        show={!!deleteTarget}
        body={t('confirm.deleteBody', { name: deleteTarget?.name ?? '' })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteProfile.isPending}
      />
    </Container>
  )
}
