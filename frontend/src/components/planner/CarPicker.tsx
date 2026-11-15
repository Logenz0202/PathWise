import { useState } from 'react'
import { Car, Check, ChevronUp, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { carDisplayName, describeCar, fuelProfile } from '@/utils/vehicle'
import { AVERAGE_CARS } from '@/hooks/useCars'
import { useCurrency } from '@/utils/currency'
import { useI18n } from '@/i18n/LanguageContext'
import { cn } from '@/lib/utils'
import type { CarProfile, SelectableCar } from '@/types'

interface CarPickerProps {
  cars: CarProfile[]
  selectedCar: SelectableCar | null
  onSelect: (car: SelectableCar) => void
  onManage: () => void
}

// Sidebar control for choosing the car the comparison uses: an average car per fuel type or one
// of the user's saved presets. Presets themselves are managed on the My Cars page.
export default function CarPicker({ cars, selectedCar, onSelect, onManage }: CarPickerProps) {
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()
  const [open, setOpen] = useState(false)
  const fmt = { t, formatNumber, formatMoney }
  const SelectedIcon = selectedCar ? fuelProfile(selectedCar.fuel_type).icon : Car

  const option = (car: SelectableCar) => {
    const active = selectedCar?.id === car.id
    const Icon = fuelProfile(car.fuel_type).icon
    return (
      <button
        key={car.id}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => {
          onSelect(car)
          setOpen(false)
        }}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent',
          active && 'bg-accent'
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{carDisplayName(car, t)}</span>
          <span className="block truncate text-xs text-muted-foreground">{describeCar(car, fmt)}</span>
        </span>
        {active && <Check className="size-4 shrink-0 text-primary" />}
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal" aria-haspopup="listbox">
          <SelectedIcon className="text-muted-foreground" />
          <span className="text-muted-foreground">{t('car.yourCar')}</span>
          <span className="truncate">{selectedCar ? carDisplayName(selectedCar, t) : t('car.average')}</span>
          <ChevronUp className="ml-auto text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-(--radix-popover-trigger-width) gap-1 p-1">
        <div role="listbox" aria-label={t('car.yourCar')} className="max-h-64 overflow-y-auto">
          {AVERAGE_CARS.map(option)}
          {cars.length > 0 && (
            <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{t('car.myCars')}</p>
          )}
          {cars.map(option)}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start border-t"
          onClick={() => {
            setOpen(false)
            onManage()
          }}
        >
          <Settings2 />
          {cars.length ? t('car.manage') : t('car.addFirst')}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
