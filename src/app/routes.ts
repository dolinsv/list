import type { AppView, DashboardTab } from '../types/report';

/** Навигация только через состояние приложения — без PII в URL */
export const APP_VIEWS = [
  'upload',
  'import',
  'select-root',
  'dashboard',
] as const satisfies readonly AppView[];

export const DASHBOARD_TABS = [
  'overview',
  'partners',
  'structure',
  'card',
] as const satisfies readonly DashboardTab[];
