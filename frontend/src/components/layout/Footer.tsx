import { useI18n } from '@/i18n/LanguageContext'

const REPO_URL = 'https://github.com/Logenz0202/PathWise'

const link = 'underline-offset-4 hover:text-foreground hover:underline'

// One line of credits for the data the app is built on
export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t">
      <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
        PathWise · {t('footer.mapData')} ©{' '}
        <a className={link} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
        , {t('footer.routing')}{' '}
        <a className={link} href="https://project-osrm.org/" target="_blank" rel="noreferrer">
          OSRM
        </a>{' '}
        ·{' '}
        <a className={link} href={REPO_URL} target="_blank" rel="noreferrer">
          {t('footer.source')}
        </a>
      </p>
    </footer>
  )
}
