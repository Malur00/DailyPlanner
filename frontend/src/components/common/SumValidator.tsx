import { Badge } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
  values: number[]
  label?: string
}

export function SumValidator({ values, label }: Props) {
  const { t } = useTranslation()
  const sum = values.reduce((a, b) => a + (Number(b) || 0), 0)
  const ok = Math.round(sum * 10) === 1000 // sum === 100.0

  if (ok) return null

  return (
    <Badge bg="danger" className="ms-2">
      {label ?? t('profiles.sumMustBe100')}: {sum.toFixed(1)} / 100
    </Badge>
  )
}
