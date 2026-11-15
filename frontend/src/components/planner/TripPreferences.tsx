import { Leaf, MessageSquare, Scale, Wallet, Zap, type LucideIcon } from 'lucide-react'
import ChoiceButton from '../ui/ChoiceButton'
import Popover from '../ui/Popover'
import TextInput from '../ui/TextInput'
import { useI18n } from '../../i18n/LanguageContext'
import type { Priority } from '../../types'

// What the traveller cares about (sent to the Eco-Coach); values match the API's `priority`
const PRIORITIES: { value: Priority; icon: LucideIcon }[] = [
  { value: 'balanced', icon: Scale },
  { value: 'fastest', icon: Zap },
  { value: 'cheapest', icon: Wallet },
  { value: 'greenest', icon: Leaf },
]

const NOTES_MAX = 200

interface TripPreferencesProps {
  priority: Priority
  onPriorityChange: (priority: Priority) => void
  notes: string
  onNotesChange: (notes: string) => void
}

// One-line summary of the trip preferences; opens a panel with priority chips and a free-text note
export default function TripPreferences({ priority, onPriorityChange, notes, onNotesChange }: TripPreferencesProps) {
  const { t } = useI18n()
  const SelectedIcon = PRIORITIES.find((p) => p.value === priority)?.icon ?? Scale

  const summary = (
    <>
      <SelectedIcon className="w-4 h-4 text-primary-600 shrink-0" />
      <span className="text-slate-500 shrink-0">{t('prefs.priorityShort')}</span>
      <span className="font-semibold text-slate-800 shrink-0">{t(`prefs.${priority}`)}</span>
      {notes.trim() && (
        <span className="flex items-center gap-1 min-w-0 text-slate-500" title={notes}>
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{notes}</span>
        </span>
      )}
    </>
  )

  return (
    <Popover summary={summary} panelClassName="p-3 space-y-3">
      {(close) => (
        <>
          <div>
            <span className="block font-semibold text-slate-700 mb-1.5">{t('prefs.priority')}</span>
            <div role="radiogroup" aria-label={t('prefs.priority')} className="grid grid-cols-4 gap-1 text-[11px]">
              {PRIORITIES.map(({ value, icon: Icon }) => (
                <ChoiceButton
                  key={value}
                  role="radio"
                  aria-checked={priority === value}
                  selected={priority === value}
                  onClick={() => onPriorityChange(value)}
                  className="px-1 py-1.5 flex flex-col items-center gap-0.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-full">{t(`prefs.${value}`)}</span>
                </ChoiceButton>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block font-semibold text-slate-700 mb-1">{t('prefs.notesLabel')}</span>
            <TextInput
              size="sm"
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
            />
          </label>
        </>
      )}
    </Popover>
  )
}
