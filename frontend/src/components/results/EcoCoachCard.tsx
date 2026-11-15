import { Lightbulb, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/i18n/LanguageContext'
import type { Comparison } from '@/types'

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
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            {t('results.aiInsight')}
          </p>
          {co2Saved > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {t('results.co2Saved', { kg: formatNumber(co2Saved) })}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-lg font-semibold">{advice.headline}</p>
          <p className="text-sm text-muted-foreground">{advice.reason}</p>
        </div>

        {advice.tips.length > 0 && (
          <ul className="space-y-1">
            {advice.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          {t('results.basedOn', { priority: t(`prefs.${comparison.priority}`) })}
          {comparison.notes && ` · ${t('results.noteQuote', { note: comparison.notes })}`}
        </p>
      </CardContent>
    </Card>
  )
}
