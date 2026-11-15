import { useState } from 'react'
import { Car, Plus } from 'lucide-react'
import CarForm from '@/components/cars/CarForm'
import CarRow from '@/components/cars/CarRow'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/common/EmptyState'
import type { CarsState } from '@/hooks/useCars'
import { describeCar } from '@/utils/vehicle'
import { useCurrency } from '@/utils/currency'
import { useI18n } from '@/i18n/LanguageContext'

// My Cars (/cars): create, edit and delete the car presets the planner can use
export default function CarsPage({ cars: carsState }: { cars: CarsState }) {
  const { cars, loaded, error, selectedCar, selectCar, createCar, updateCar, deleteCar } = carsState
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()
  const [editing, setEditing] = useState<'new' | number | null>(null)
  const fmt = { t, formatNumber, formatMoney }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t('cars.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('cars.intro')}</p>
        </div>
        {editing !== 'new' && (
          <Button type="button" onClick={() => setEditing('new')}>
            <Plus />
            {t('cars.add')}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
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
              onDelete={() => deleteCar(car.id)}
            />
          )
        )}
      </div>
    </div>
  )
}
