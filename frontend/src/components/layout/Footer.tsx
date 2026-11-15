import { Bus, Car, Train } from 'lucide-react'
import { useI18n } from '../../i18n/LanguageContext'

// Literal class names so Tailwind picks them up
const MODE_LINKS = [
  { icon: Car, labelKey: 'footer.car', hover: 'hover:text-blue-400', color: 'text-blue-500' },
  { icon: Train, labelKey: 'footer.rail', hover: 'hover:text-red-400', color: 'text-red-500' },
  { icon: Bus, labelKey: 'footer.bus', hover: 'hover:text-amber-400', color: 'text-amber-500' },
] as const

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">PathWise</span>
          <span>—</span>
          <span>{t('footer.tagline')}</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400 font-medium">
          {MODE_LINKS.map(({ icon: Icon, labelKey, hover, color }) => (
            <div key={labelKey} className={`flex items-center gap-1.5 transition-colors ${hover}`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span>{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
