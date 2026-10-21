import {
  LayoutDashboard,
  Users,
  Network,
  UserRound,
  RefreshCw,
  Eraser,
  FolderOpen,
} from 'lucide-react';
import styles from '../styles/app.module.css';
import { SessionProvider, useSession } from '../context/SessionContext';
import { FileUploader } from '../components/FileUploader';
import { ImportReport } from '../components/ImportReport';
import { RootSelector } from '../components/RootSelector';
import { OverviewPanel } from '../components/OverviewPanel';
import { PartnerSearch } from '../components/PartnerSearch';
import { PartnerCard } from '../components/PartnerCard';
import { StructureTree } from '../components/StructureTree';
import { Toast } from '../components/Toast';
import type { DashboardTab } from '../types/report';

const TABS: Array<{
  id: DashboardTab;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Обзор', short: 'Обзор', icon: LayoutDashboard },
  { id: 'partners', label: 'Партнёры', short: 'Поиск', icon: Users },
  { id: 'structure', label: 'Структура', short: 'Дерево', icon: Network },
  { id: 'card', label: 'Карточка', short: 'Профиль', icon: UserRound },
];

const TAB_TITLES: Record<DashboardTab, string> = {
  overview: 'Моя структура',
  partners: 'Партнёры',
  structure: 'Структура команды',
  card: 'Карточка партнёра',
};

function Dashboard() {
  const { state, index, setTab, clearData, changeRoot } = useSession();
  const root = state.rootPartnerNumber
    ? index?.byNumber.get(state.rootPartnerNumber)
    : null;

  const replaceFile = () => {
    clearData();
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sideNav} aria-label="Разделы">
        <div className={styles.sideBrand}>
          <div className={styles.sideBrandTitle}>Анализ структуры</div>
          <div className={styles.sideBrandSub}>Oriflame · локально</div>
        </div>
        <nav className={styles.navList}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = state.tab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={() => setTab(tab.id)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={styles.navIcon} strokeWidth={2} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <header className={styles.topHeader}>
        <div className={styles.headerTitleBlock}>
          <h1 className={styles.headerTitle}>{TAB_TITLES[state.tab]}</h1>
          <div className={styles.headerMeta}>
            {root ? (
              <span className={styles.headerMetaItem}>
                Корень:{' '}
                <strong>
                  {root.partnerNumber}
                  {root.fullName ? ` · ${root.fullName}` : ''}
                </strong>
              </span>
            ) : null}
            {state.report?.catalogLabel ? (
              <span className={styles.headerMetaItem}>
                Каталог: <strong>{state.report.catalogLabel}</strong>
              </span>
            ) : null}
            {state.report?.reportDate ? (
              <span className={styles.headerMetaItem}>
                Отчёт: <strong>{state.report.reportDate}</strong>
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnGhost} onClick={changeRoot}>
            <RefreshCw size={16} strokeWidth={2} />
            Сменить корень
          </button>
          <button type="button" className={styles.btn} onClick={replaceFile}>
            <FolderOpen size={16} strokeWidth={2} />
            Другой файл
          </button>
          <button type="button" className={styles.btnDanger} onClick={clearData}>
            <Eraser size={16} strokeWidth={2} />
            Очистить
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {state.tab === 'overview' ? <OverviewPanel /> : null}
        {state.tab === 'partners' ? <PartnerSearch /> : null}
        {state.tab === 'structure' ? <StructureTree /> : null}
        {state.tab === 'card' ? <PartnerCard /> : null}
      </main>

      <nav className={styles.mobileNav} aria-label="Мобильная навигация">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = state.tab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              onClick={() => setTab(tab.id)}
            >
              <Icon className={styles.navIcon} strokeWidth={2} />
              {tab.short}
            </button>
          );
        })}
      </nav>
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
      <Toast />
    </SessionProvider>
  );
}
