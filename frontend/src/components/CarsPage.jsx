import { useState } from 'react'
import { Car, Pencil, Plus, Trash2 } from 'lucide-react'
import { describeCar, fuelProfile } from '../utils/vehicle'
import { useCurrency } from '../utils/currency'
import { useI18n } from '../i18n/LanguageContext'
import CarForm from './CarForm'

// "My cars": create, edit and delete saved car presets used by the comparison.
export default function CarsPage({ cars, loaded, error, selectedCar, onCreate, onUpdate, onDelete }) {
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()
  const [editing, setEditing] = useState(null) // null | 'new' | car id
  const fmt = { t, formatNumber, formatMoney }

  const handleDelete = async (car) => {
    if (!confirm(t('cars.confirmDelete', { name: car.name }))) return
    try {
      await onDelete(car.id)
    } catch {
      alert(t('cars.deleteFailed'))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="text-2xl font-bold text-gray-900">{t('cars.title')}</h2>
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            {t('cars.add')}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-5">{t('cars.intro')}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {editing === 'new' && (
          <CarForm
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              await onCreate(data)
              setEditing(null)
            }}
          />
        )}

        {loaded && cars.length === 0 && editing !== 'new' && (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('cars.empty')}</h3>
            <p className="text-gray-500">{t('cars.emptyHint')}</p>
          </div>
        )}

        {cars.map((car) =>
          editing === car.id ? (
            <CarForm
              key={car.id}
              car={car}
              onCancel={() => setEditing(null)}
              onSave={async (data) => {
                await onUpdate(car.id, data)
                setEditing(null)
              }}
            />
          ) : (
            <CarRow
              key={car.id}
              car={car}
              summary={describeCar(car, fmt)}
              inUse={selectedCar?.id === car.id}
              onEdit={() => setEditing(car.id)}
              onDelete={() => handleDelete(car)}
            />
          )
        )}
      </div>
    </div>
  )
}

function CarRow({ car, summary, inUse, onEdit, onDelete }) {
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
        <button
          type="button"
          onClick={onEdit}
          title={t('cars.edit')}
          aria-label={t('cars.editLabel', { name: car.name })}
          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={t('cars.delete')}
          aria-label={t('cars.deleteLabel', { name: car.name })}
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
