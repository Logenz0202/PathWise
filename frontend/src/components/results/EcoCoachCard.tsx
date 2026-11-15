import { Lightbulb, Sparkles } from 'lucide-react'
import { useI18n } from '../../i18n/LanguageContext'
import { cx } from '../../utils/cx'
import type { Comparison } from '../../types'

interface EcoCoachCardProps {
  comparison: Comparison
  // kg of CO₂ saved by the greenest option compared with the most polluting one
  co2Saved: number
}

// The AI Eco-Coach's recommendation: headline, reasoning, what it was based on and tips
export default function EcoCoachCard({ comparison, co2Saved }: EcoCoachCardProps) {
  const { t, formatNumber } = useI18n()
  const advice = comparison.ai_advice

  return (
    <div
      className={cx(
        'relative overflow-hidden p-6 rounded-2xl shadow-xl border border-emerald-500/30 text-white',
        'bg-linear-to-br from-emerald-900 via-slate-900 to-slate-950'
      )}
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cx(
                'px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-950/80',
                'text-xs font-bold uppercase tracking-wider text-emerald-400'
              )}
            >
              {t('results.aiInsight')}
            </span>
            {co2Saved > 0 && (
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {t('results.co2Saved', { kg: formatNumber(co2Saved) })}
              </span>
            )}
          </div>

          <p className="text-lg font-bold text-white leading-snug">{advice.headline}</p>
          <p className="text-slate-200 text-sm leading-relaxed">{advice.reason}</p>
          <p className="text-xs text-emerald-300/80">
            {t('results.basedOn', { priority: t(`prefs.${comparison.priority}`) })}
            {comparison.notes && ` · ${t('results.noteQuote', { note: comparison.notes })}`}
          </p>
          {advice.tips.length > 0 && (
            <ul className="pt-1 space-y-1">
              {advice.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-emerald-100/90">
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
