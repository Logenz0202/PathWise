import { useCallback, useRef, useState } from 'react'
import { ChevronUp, Leaf, MessageSquare, Scale, Wallet, Zap } from 'lucide-react'
import { useI18n } from '../i18n/LanguageContext'
import { useDismiss } from '../hooks/useDismiss'

// What the traveller cares about (sent to the Eco-Coach); values match the API's `priority`
const PRIORITIES = [
  { value: 'balanced', icon: Scale },
  { value: 'fastest', icon: Zap },
  { value: 'cheapest', icon: Wallet },
  { value: 'greenest', icon: Leaf },
]

const NOTES_MAX = 200

// One-line summary of the trip preferences; opens a panel with priority chips and a free-text note
export default function TripPreferences({ priority, onPriorityChange, notes, onNotesChange }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  const SelectedIcon = PRIORITIES.find((p) => p.value === priority)?.icon ?? Scale

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full px-3 py-2 rounded-xl border flex items-center gap-2 text-xs bg-white transition-colors ${
          open ? 'border-primary-400' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <SelectedIcon className="w-4 h-4 text-primary-600 shrink-0" />
        <span className="text-slate-500 shrink-0">{t('prefs.priorityShort')}</span>
        <span className="font-semibold text-slate-800 shrink-0">{t(`prefs.${priority}`)}</span>
        {notes.trim() && (
          <span className="flex items-center gap-1 min-w-0 text-slate-500" title={notes}>
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{notes}</span>
          </span>
        )}
        <ChevronUp
          className={`w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 space-y-3 text-xs bg-white rounded-xl border border-slate-200 shadow-xl z-20">
          <div>
            <span className="block font-semibold text-slate-700 mb-1.5">{t('prefs.priority')}</span>
            <div role="radiogroup" aria-label={t('prefs.priority')} className="grid grid-cols-4 gap-1 text-[11px]">
              {PRIORITIES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={priority === value}
                  onClick={() => onPriorityChange(value)}
                  className={`px-1 py-1.5 rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                    priority === value
                      ? 'border-primary-500 bg-primary-50 text-primary-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-full">{t(`prefs.${value}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block font-semibold text-slate-700 mb-1">{t('prefs.notesLabel')}</span>
            <input
              type="text"
              value={notes}
              maxLength={NOTES_MAX}
              onChange={(e) => onNotesChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault() // don't submit the comparison from here
                  close()
                }
              }}
              placeholder={t('prefs.notesPlaceholder')}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </label>
        </div>
      )}
    </div>
  )
}
