import { Pencil, Trash2 } from 'lucide-react'
import IconButton from '../ui/IconButton'
import { useI18n } from '../../i18n/LanguageContext'
import { fuelProfile } from '../../utils/vehicle'
import type { CarProfile } from '../../types'

interface CarRowProps {
  car: CarProfile
  // "Diesel · 5,4 L/100km · 6,89 zł/L"
  summary: string
  // Whether this preset is the one the planner currently uses
  inUse: boolean
  onEdit: () => void
  onDelete: () => void
}

// A saved car preset in the My Cars list
export default function CarRow({ car, summary, inUse, onEdit, onDelete }: CarRowProps) {
  const { t } = useI18n()
  const Icon = fuelProfile(car.fuel_type).icon
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{car.name}</h3>
          {inUse && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              {t('cars.inUse')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{summary}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <IconButton icon={Pencil} title={t('cars.edit')} label={t('cars.editLabel', { name: car.name })} onClick={onEdit} />
        <IconButton
          icon={Trash2}
          tone="danger"
          title={t('cars.delete')}
          label={t('cars.deleteLabel', { name: car.name })}
          onClick={onDelete}
        />
      </div>
    </div>
  )
}
