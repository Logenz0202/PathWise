import { useMap } from 'react-leaflet'
import { Moon, RotateCcw, Sun, ZoomIn, ZoomOut, type LucideIcon } from 'lucide-react'
import { MAP_CENTER, MAP_ZOOM } from '../../utils/geoData'
import { useI18n } from '../../i18n/LanguageContext'
import { cx } from '../../utils/cx'

function ControlButton({ icon: Icon, title, onClick }: { icon: LucideIcon; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cx(
        'p-2.5 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md transition-all',
        'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

// Zoom, reset and light/dark tiles buttons in the bottom-right corner (inside <MapContainer>)
export default function MapControls({ darkTiles, onToggleTiles }: { darkTiles: boolean; onToggleTiles: () => void }) {
  const map = useMap()
  const { t } = useI18n()
  return (
    <div className="absolute bottom-8 right-5 z-1000 flex flex-col gap-2">
      <ControlButton icon={ZoomIn} title={t('map.zoomIn')} onClick={() => map.zoomIn()} />
      <ControlButton icon={ZoomOut} title={t('map.zoomOut')} onClick={() => map.zoomOut()} />
      <ControlButton icon={RotateCcw} title={t('map.reset')} onClick={() => map.setView(MAP_CENTER, MAP_ZOOM)} />
      <ControlButton
        icon={darkTiles ? Sun : Moon}
        title={t(darkTiles ? 'map.lightMap' : 'map.darkMap')}
        onClick={onToggleTiles}
      />
    </div>
  )
}
