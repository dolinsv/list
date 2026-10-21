import type { Partner } from './partner';

export type CanonicalField =
  | 'partnerNumber'
  | 'fullName'
  | 'registrationCatalog'
  | 'phone'
  | 'email'
  | 'sponsorNumber'
  | 'inviterNumber'
  | 'fileLevel'
  | 'personalBB'
  | 'beautyBB'
  | 'groupBB'
  | 'percent'
  | 'maxPercent'
  | 'salesVolume'
  | 'groupSalesVolume'
  | 'wellnessBB'
  | 'novAgeBB'
  | 'programPlus'
  | 'teamBonus'
  | 'teamBonusPlus'
  | 'recommendBonus'
  | 'extraBonuses'
  | 'overdueDebt'
  | 'inactiveCatalogs'
  | 'status';

export type ColumnMapping = {
  field: CanonicalField;
  header: string;
  columnIndex: number;
};

export type ImportWarningCode =
  | 'duplicate_numbers'
  | 'empty_numbers'
  | 'missing_sponsors'
  | 'self_sponsor'
  | 'cycles'
  | 'unparsed_metrics'
  | 'missing_optional_fields'
  | 'unknown_columns'
  | 'missing_name'
  | 'missing_analytics_metric';

export type ImportWarning = {
  code: ImportWarningCode;
  message: string;
  count?: number;
};

export type ImportValidation = {
  ok: boolean;
  criticalErrors: string[];
  warnings: ImportWarning[];
  fileName: string;
  sheetName: string | null;
  rowCount: number;
  partnerCount: number;
  uniqueNumbers: number;
  missingKeyFields: number;
  duplicateNumbers: number;
  mappedColumns: ColumnMapping[];
  unmappedHeaders: string[];
  required: {
    partnerNumber: boolean;
    identity: boolean;
    sponsorLink: boolean;
    analyticsMetric: boolean;
  };
  suggestedRootNumber: string | null;
  suggestedRootName: string | null;
};

export type ParsedReport = {
  partners: Partner[];
  validation: ImportValidation;
  catalogLabel: string | null;
  reportDate: string | null;
};

export type AppView =
  | 'upload'
  | 'import'
  | 'select-root'
  | 'dashboard';

export type DashboardTab = 'overview' | 'partners' | 'structure' | 'card';

export type PartnersIntent = {
  /** Увеличивается при каждом запросе фокуса поиска */
  focusToken: number;
  minPersonalBB: string | null;
};

export type SessionState = {
  view: AppView;
  tab: DashboardTab;
  report: ParsedReport | null;
  rootPartnerNumber: string | null;
  selectedPartnerNumber: string | null;
  structureSearch: string;
  importError: string | null;
  isParsing: boolean;
  /** Откуда открыли карточку — для кнопки «Назад» */
  cardReturnTab: DashboardTab | null;
  partnersIntent: PartnersIntent;
  toastMessage: string | null;
};
