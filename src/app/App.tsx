import {
  LayoutDashboard,
  Users,
  Network,
  UserRound,
  RefreshCw,
  Eraser,
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
  structure: 'Структура',
  card: 'Карточка',
};

function Dashboard() {
  const { state, index, setTab, clearData, changeRoot } = useSession();
  const root = state.rootPartnerNumber
    ? index?.byNumber.get(state.rootPartnerNumber)
    : null;

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
        <div className={styles.headerTopRow}>
          <div className={styles.headerTitleBlock}>
            <h1 className={styles.headerTitle}>{TAB_TITLES[state.tab]}</h1>
            {root ? (
              <p className={styles.headerSubtitle}>
                {root.fullName ?? root.partnerNumber}
                <span className={styles.headerDot}>·</span>
                {root.partnerNumber}
              </p>
            ) : null}
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={changeRoot}
              title="Сменить корень анализа"
            >
              <RefreshCw size={16} strokeWidth={2} />
              <span>Корень</span>
            </button>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnDanger}`}
              onClick={clearData}
              title="Очистить данные и загрузить другой файл"
            >
              <Eraser size={16} strokeWidth={2} />
              <span>Сброс</span>
            </button>
          </div>
        </div>
        {(state.report?.catalogLabel || state.report?.reportDate) && (
          <div className={styles.headerMeta}>
            {state.report?.catalogLabel ? (
              <span className={styles.metaPill}>
                Каталог {state.report.catalogLabel}
              </span>
            ) : null}
            {state.report?.reportDate ? (
              <span className={styles.metaPill}>
                Отчёт {state.report.reportDate}
              </span>
            ) : null}
          </div>
        )}
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
