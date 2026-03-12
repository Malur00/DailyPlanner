import { useState } from 'react'
import {
  Container, Row, Col, Form, Table, Button, Badge,
  Spinner, Alert, InputGroup,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useMealPlans } from '../../hooks/useMealPlans'
import {
  useGroceryList, useCheckGroceryItem,
  useAddGroceryItem, useRemoveGroceryItem,
} from '../../hooks/useGroceryList'
import { useIngredients } from '../../hooks/useIngredients'
import { useProfile } from '../../context/ProfileContext'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { ErrorAlert } from '../../components/common/ErrorAlert'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { GroceryItem } from '../../types/groceryList'

export default function GroceryListPage() {
  const { t } = useTranslation()
  const { activeProfile } = useProfile()
  const { data: plans = [] } = useMealPlans(activeProfile?.id ?? null)

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  const { data: groceryList, isLoading, error } = useGroceryList(selectedPlanId)
  const checkItem = useCheckGroceryItem()
  const addItem = useAddGroceryItem()
  const removeItem = useRemoveGroceryItem()

  const { data: allIngredients = [] } = useIngredients()

  const [addIngSearch, setAddIngSearch] = useState('')
  const [addIngId, setAddIngId] = useState<number | ''>('')
  const [addQty, setAddQty] = useState<number>(100)
  const [deleteTarget, setDeleteTarget] = useState<GroceryItem | null>(null)

  if (!activeProfile) {
    return (
      <Container>
        <h4 className="mb-3">{t('grocery.title')}</h4>
        <Alert variant="info">{t('weightLogs.selectProfile')}</Alert>
      </Container>
    )
  }

  const handleCheck = (item: GroceryItem) => {
    if (!selectedPlanId) return
    checkItem.mutate({ mealPlanId: selectedPlanId, itemId: item.id, checked: !item.checked })
  }

  const handleAddItem = async () => {
    if (!selectedPlanId || !addIngId) return
    await addItem.mutateAsync({
      mealPlanId: selectedPlanId,
      data: { ingredient_id: Number(addIngId), quantity_g: addQty },
    })
    setAddIngId('')
    setAddIngSearch('')
    setAddQty(100)
  }

  const handleDelete = async () => {
    if (!deleteTarget || !selectedPlanId) return
    await removeItem.mutateAsync({ mealPlanId: selectedPlanId, itemId: deleteTarget.id })
    setDeleteTarget(null)
  }

  const filteredIngredients = allIngredients.filter(i =>
    i.name.toLowerCase().includes(addIngSearch.toLowerCase())
  )

  const items = groceryList?.items ?? []
  const checked = items.filter(i => i.checked)
  const unchecked = items.filter(i => !i.checked)

  return (
    <Container fluid>
      <h4 className="mb-3">{t('grocery.title')}</h4>

      {/* Plan selector */}
      <Row className="g-2 mb-4">
        <Col md={4}>
          <Form.Select
            value={selectedPlanId ?? ''}
            onChange={e => setSelectedPlanId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('grocery.selectPlan')}</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {t('meals.weekOf')} {p.week_start_date}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {!selectedPlanId && plans.length === 0 && (
        <Alert variant="info">{t('grocery.noPlan')}</Alert>
      )}

      {selectedPlanId && isLoading && <LoadingSpinner />}
      {selectedPlanId && error && (
        <Alert variant="warning">{t('grocery.noPlan')}</Alert>
      )}

      {groceryList && (
        <>
          {/* Add manual item */}
          <div className="border rounded p-3 mb-4 bg-light">
            <strong className="d-block mb-2 small">{t('grocery.addManualItem')}</strong>
            <InputGroup size="sm">
              <Form.Control
                placeholder={t('meals.ingredientSearch')}
                value={addIngSearch}
                onChange={e => { setAddIngSearch(e.target.value); setAddIngId('') }}
                list="grocery-ing-list"
              />
              <datalist id="grocery-ing-list">
                {filteredIngredients.slice(0, 20).map(i => (
                  <option key={i.id} value={i.name} />
                ))}
              </datalist>
              <Form.Control
                type="number" min={1} step={1}
                placeholder={t('grocery.quantityG')}
                value={addQty}
                onChange={e => setAddQty(Number(e.target.value))}
                style={{ maxWidth: 110 }}
              />
              <Button
                variant="outline-primary"
                disabled={addItem.isPending}
                onClick={() => {
                  const found = allIngredients.find(i =>
                    i.name.toLowerCase() === addIngSearch.toLowerCase()
                  )
                  if (found) { setAddIngId(found.id); setTimeout(handleAddItem, 0) }
                }}
              >
                {addItem.isPending ? <Spinner size="sm" animation="border" /> : t('common.add')}
              </Button>
            </InputGroup>
          </div>

          {items.length === 0 && (
            <p className="text-muted">{t('grocery.noItems')}</p>
          )}

          {/* Unchecked items */}
          {unchecked.length > 0 && (
            <Table hover size="sm" className="mb-3">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>{t('grocery.ingredient')}</th>
                  <th>{t('grocery.quantityG')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {unchecked.map(item => (
                  <tr key={item.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={false}
                        onChange={() => handleCheck(item)}
                      />
                    </td>
                    <td>{item.ingredient?.name ?? item.ingredient_id}</td>
                    <td>{item.quantity_g} g</td>
                    <td>
                      <Button
                        size="sm" variant="outline-danger"
                        onClick={() => setDeleteTarget(item)}
                      >×</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <>
              <div className="d-flex align-items-center mb-2">
                <Badge bg="success" className="me-2">{t('grocery.purchased')}</Badge>
                <span className="text-muted small">{checked.length} items</span>
              </div>
              <Table hover size="sm" className="opacity-50">
                <tbody>
                  {checked.map(item => (
                    <tr key={item.id}>
                      <td style={{ width: 36 }}>
                        <Form.Check
                          type="checkbox"
                          checked={true}
                          onChange={() => handleCheck(item)}
                        />
                      </td>
                      <td className="text-decoration-line-through">
                        {item.ingredient?.name ?? item.ingredient_id}
                      </td>
                      <td>{item.quantity_g} g</td>
                      <td>
                        <Button
                          size="sm" variant="outline-danger"
                          onClick={() => setDeleteTarget(item)}
                        >×</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        body={t('confirm.deleteBody', { name: deleteTarget?.ingredient?.name ?? String(deleteTarget?.ingredient_id) })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={removeItem.isPending}
      />
    </Container>
  )
}
