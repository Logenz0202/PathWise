import { useEffect, useRef, useState } from 'react'
import { Car, Check, ChevronUp, Settings2 } from 'lucide-react'
import { describeCar, fuelProfile } from '../utils/vehicle'
import { useCurrency } from '../utils/currency'
import { useI18n } from '../i18n/LanguageContext'

// Sidebar control for choosing which saved car the comparison uses ("average car" = none).
// Opens a list above itself; presets are created and edited on the My cars page.
export default function CarPicker({ cars, selectedCar, onSelect, onManage }) {
  const { t, formatNumber } = useI18n()
  const { formatMoney } = useCurrency()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const fmt = { t, formatNumber, formatMoney }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (id) => {
    onSelect(id)
    setOpen(false)
  }

  const SelectedIcon = selectedCar ? fuelProfile(selectedCar.fuel_type).icon : Car

  const option = (id, title, subtitle, Icon) => {
    const active = (selectedCar?.id ?? null) === id
    return (
      <button
        key={id ?? 'average'}
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => choose(id)}
        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
          active ? 'bg-primary-50' : 'hover:bg-slate-50'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-800 truncate">{title}</span>
          <span className="block text-[11px] text-slate-500 truncate">{subtitle}</span>
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
          {selectedCar ? selectedCar.name : t('car.average')}
        </span>
        <ChevronUp
          className={`w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 text-xs bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
          <div role="listbox" aria-label={t('car.yourCar')} className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {option(null, t('car.average'), t('car.averageHint'), Car)}
            {cars.map((car) => option(car.id, car.name, describeCar(car, fmt), fuelProfile(car.fuel_type).icon))}
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
