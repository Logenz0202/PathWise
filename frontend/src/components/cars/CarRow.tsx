import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ConfirmButton from '@/components/common/ConfirmButton'
import { useI18n } from '@/i18n/LanguageContext'
import { fuelProfile } from '@/utils/vehicle'
import type { CarProfile } from '@/types'

interface CarRowProps {
  car: CarProfile
  // "Diesel · 5,4 L/100km · 6,89 zł/L"
  summary: string
  // Whether this preset is the one the planner currently uses
  inUse: boolean
  onEdit: () => void
  onDelete: () => Promise<void>
}

// A saved car preset in the My Cars list
export default function CarRow({ car, summary, inUse, onEdit, onDelete }: CarRowProps) {
  const { t } = useI18n()
  const Icon = fuelProfile(car.fuel_type).icon
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{car.name}</h3>
          {inUse && <Badge variant="outline">{t('cars.inUse')}</Badge>}
        </div>
        <p className="truncate text-xs text-muted-foreground tabular-nums">{summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          title={t('cars.edit')}
          aria-label={t('cars.editLabel', { name: car.name })}
          className="text-muted-foreground"
        >
          <Pencil />
        </Button>
        <ConfirmButton
          icon={Trash2}
          title={t('cars.delete')}
          label={t('cars.deleteLabel', { name: car.name })}
          message={t('cars.confirmDelete', { name: car.name })}
          confirmLabel={t('cars.delete')}
          cancelLabel={t('cars.cancel')}
          errorMessage={t('cars.deleteFailed')}
          onConfirm={onDelete}
        />
      </div>
    </div>
  )
}
