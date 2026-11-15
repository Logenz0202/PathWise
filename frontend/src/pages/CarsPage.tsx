import { useState } from 'react'
import { Car, Plus } from 'lucide-react'
import CarForm from '../components/cars/CarForm'
import CarRow from '../components/cars/CarRow'
import Alert from '../components/ui/Alert'
import EmptyState from '../components/ui/EmptyState'
import Panel from '../components/ui/Panel'
import type { CarsState } from '../hooks/useCars'
import { describeCar } from '../utils/vehicle'
import { useCurrency } from '../utils/currency'
import { useI18n } from '../i18n/LanguageContext'
import type { CarProfile } from '../types'

// My Cars (/cars): create, edit and delete the car presets the planner can use
export default function CarsPage({ cars: carsState }: { cars: CarsState }) {
  const { cars, loaded, error, selectedCar, selectCar, createCar, updateCar, deleteCar } = carsState
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()
  const [editing, setEditing] = useState<'new' | number | null>(null)
  const fmt = { t, formatNumber, formatMoney }

  const handleDelete = async (car: CarProfile) => {
    if (!confirm(t('cars.confirmDelete', { name: car.name }))) return
    try {
      await deleteCar(car.id)
    } catch {
      alert(t('cars.deleteFailed'))
    }
  }

  return (
    <Panel>
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

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="space-y-3">
        {editing === 'new' && (
          <CarForm
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              // A newly added car is most likely the one the user wants to compare with
              selectCar(await createCar(data))
              setEditing(null)
            }}
          />
        )}

        {loaded && cars.length === 0 && editing !== 'new' && (
          <EmptyState icon={Car} title={t('cars.empty')} hint={t('cars.emptyHint')} />
        )}

        {cars.map((car) =>
          editing === car.id ? (
            <CarForm
              key={car.id}
              car={car}
              onCancel={() => setEditing(null)}
              onSave={async (data) => {
                await updateCar(car.id, data)
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
    </Panel>
  )
}
