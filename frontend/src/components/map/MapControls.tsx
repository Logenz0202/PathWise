import { useMap } from 'react-leaflet'
import { Minus, Moon, Plus, RotateCcw, Sun, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAP_CENTER, MAP_ZOOM } from '@/utils/geoData'
import { useI18n } from '@/i18n/LanguageContext'

function ControlButton({ icon: Icon, title, onClick }: { icon: LucideIcon; title: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="bg-card/90 backdrop-blur-sm"
    >
      <Icon />
    </Button>
  )
}

// Zoom, reset and light/dark tiles buttons in the bottom-right corner (inside <MapContainer>)
export default function MapControls({ darkTiles, onToggleTiles }: { darkTiles: boolean; onToggleTiles: () => void }) {
  const map = useMap()
  const { t } = useI18n()
  return (
    <div className="absolute right-3 bottom-10 z-1000 flex flex-col gap-1.5">
      <ControlButton icon={Plus} title={t('map.zoomIn')} onClick={() => map.zoomIn()} />
      <ControlButton icon={Minus} title={t('map.zoomOut')} onClick={() => map.zoomOut()} />
      <ControlButton icon={RotateCcw} title={t('map.reset')} onClick={() => map.setView(MAP_CENTER, MAP_ZOOM)} />
      <ControlButton
        icon={darkTiles ? Sun : Moon}
        title={t(darkTiles ? 'map.lightMap' : 'map.darkMap')}
        onClick={onToggleTiles}
      />
    </div>
  )
}
