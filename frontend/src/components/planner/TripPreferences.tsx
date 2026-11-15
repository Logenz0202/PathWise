import { useState } from 'react'
import { ChevronUp, Leaf, MessageSquare, Scale, Wallet, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useI18n } from '@/i18n/LanguageContext'
import type { Priority } from '@/types'

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

// One-line summary of the trip preferences; opens a panel with the priority and a free-text note
export default function TripPreferences({ priority, onPriorityChange, notes, onNotesChange }: TripPreferencesProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const SelectedIcon = PRIORITIES.find((p) => p.value === priority)?.icon ?? Scale

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal">
          <SelectedIcon className="text-muted-foreground" />
          <span className="text-muted-foreground">{t('prefs.priorityShort')}</span>
          <span>{t(`prefs.${priority}`)}</span>
          {notes.trim() && (
            <span className="flex min-w-0 items-center gap-1 text-muted-foreground" title={notes}>
              <MessageSquare className="size-3.5" />
              <span className="truncate">{notes}</span>
            </span>
          )}
          <ChevronUp className="ml-auto text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-(--radix-popover-trigger-width) gap-3 p-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t('prefs.priority')}</p>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={priority}
            // Radix sends '' when the active item is clicked again; keep the current value then
            onValueChange={(value) => value && onPriorityChange(value as Priority)}
            aria-label={t('prefs.priority')}
            className="grid w-full grid-cols-4"
          >
            {PRIORITIES.map(({ value, icon: Icon }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="h-auto flex-col gap-1 py-2 text-xs data-[state=on]:text-primary"
              >
                <Icon />
                {t(`prefs.${value}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <label className="block space-y-1.5">
          <span className="block text-xs font-medium text-muted-foreground">{t('prefs.notesLabel')}</span>
          <Input
            type="text"
            value={notes}
            maxLength={NOTES_MAX}
            onChange={(e) => onNotesChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault() // don't submit the comparison from here
                setOpen(false)
              }
            }}
            placeholder={t('prefs.notesPlaceholder')}
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}
