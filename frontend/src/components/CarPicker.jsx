import { useCallback, useRef, useState } from 'react'
import { Car, Check, ChevronUp, Settings2 } from 'lucide-react'
import { carDisplayName, describeCar, fuelProfile } from '../utils/vehicle'
import { AVERAGE_CARS } from '../hooks/useCars'
import { useCurrency } from '../utils/currency'
import { useI18n } from '../i18n/LanguageContext'
import { useDismiss } from '../hooks/useDismiss'

// Sidebar control for choosing the car the comparison uses: an average car per fuel type or one
// of the user's saved presets. Opens a list above itself; presets are managed on the My cars page.
export default function CarPicker({ cars, selectedCar, onSelect, onManage }) {
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const fmt = { t, formatNumber, formatMoney }

  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  const choose = (car) => {
    onSelect(car)
    setOpen(false)
  }

  const SelectedIcon = selectedCar ? fuelProfile(selectedCar.fuel_type).icon : Car

  const option = (car) => {
    const active = selectedCar?.id === car.id
    const Icon = fuelProfile(car.fuel_type).icon
    return (
      <button
        key={car.id}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => choose(car)}
        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
          active ? 'bg-primary-50' : 'hover:bg-slate-50'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-800 truncate">{carDisplayName(car, t)}</span>
          <span className="block text-[11px] text-slate-500 truncate">{describeCar(car, fmt)}</span>
        </span>
        {active && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
      </button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full px-3 py-2 rounded-xl border flex items-center gap-2 text-xs bg-white transition-colors ${
          open ? 'border-primary-400' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <SelectedIcon className="w-4 h-4 text-primary-600 shrink-0" />
        <span className="text-slate-500 shrink-0">{t('car.yourCar')}</span>
        <span className="font-semibold text-slate-800 truncate">
          {selectedCar ? carDisplayName(selectedCar, t) : t('car.average')}
        </span>
        <ChevronUp
          className={`w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 text-xs bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
          <div role="listbox" aria-label={t('car.yourCar')} className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {AVERAGE_CARS.map(option)}
            {cars.length > 0 && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t('car.myCars')}
              </div>
            )}
            {cars.map(option)}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onManage()
            }}
            className="w-full px-3 py-2 flex items-center gap-2 border-t border-slate-200 bg-slate-50 hover:bg-slate-100 text-primary-700 font-semibold transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {cars.length ? t('car.manage') : t('car.addFirst')}
          </button>
        </div>
      )}
    </div>
  )
}
