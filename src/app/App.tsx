import styles from '../styles/app.module.css';
import { SessionProvider, useSession } from '../context/SessionContext';
import { FileUploader } from '../components/FileUploader';
import { ImportReport } from '../components/ImportReport';
import { RootSelector } from '../components/RootSelector';
import { OverviewPanel } from '../components/OverviewPanel';
import { PartnerSearch } from '../components/PartnerSearch';
import { PartnerCard } from '../components/PartnerCard';
import { StructureTree } from '../components/StructureTree';
import type { DashboardTab } from '../types/report';

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: 'overview', label: 'Обзор' },
  { id: 'partners', label: 'Партнёры' },
  { id: 'structure', label: 'Структура' },
  { id: 'card', label: 'Карточка' },
];

function Dashboard() {
  const { state, setTab, clearData, changeRoot } = useSession();
  const rootLabel = state.rootPartnerNumber ?? '—';

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandName}>Анализ структуры Oriflame</div>
          <div className={styles.brandMeta}>
            Корень: {rootLabel}
            {state.report?.validation.fileName
              ? ` · ${state.report.validation.fileName}`
              : ''}
          </div>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.btnGhost} onClick={changeRoot}>
            Сменить корень
          </button>
          <button type="button" className={styles.btnDanger} onClick={clearData}>
            Очистить данные
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Разделы анализа">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.navBtn} ${
                state.tab === tab.id ? styles.navBtnActive : ''
              }`}
              onClick={() => setTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <main className={styles.main}>
          {state.tab === 'overview' ? <OverviewPanel /> : null}
          {state.tab === 'partners' ? <PartnerSearch /> : null}
          {state.tab === 'structure' ? <StructureTree /> : null}
          {state.tab === 'card' ? <PartnerCard /> : null}
        </main>
      </div>
    </div>
  );
}

function AppShell() {
  const { state } = useSession();

  if (state.view === 'upload') {
    return (
      <div className={styles.shell}>
        <FileUploader />
      </div>
    );
  }

  if (state.view === 'import') {
    return (
      <div className={styles.shell}>
        <div className={styles.hero}>
          <ImportReport />
        </div>
      </div>
    );
  }

  if (state.view === 'select-root') {
    return (
      <div className={styles.shell}>
        <div className={styles.hero}>
          <RootSelector />
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}
