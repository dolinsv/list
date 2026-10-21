import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { parseWorkbookFile } from '../features/import/parseWorkbook';
import { buildPartnerIndex } from '../features/partners/buildPartnerIndex';
import type { PartnerIndex } from '../types/partner';
import type {
  AppView,
  DashboardTab,
  ParsedReport,
  SessionState,
} from '../types/report';
import { clearBrowserReportTraces } from '../utils/clearSession';

type Action =
  | { type: 'PARSE_START' }
  | { type: 'PARSE_SUCCESS'; report: ParsedReport }
  | { type: 'PARSE_ERROR'; message: string }
  | { type: 'CONFIRM_ROOT'; partnerNumber: string }
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'SET_TAB'; tab: DashboardTab }
  | {
      type: 'SELECT_PARTNER';
      partnerNumber: string | null;
      returnTab?: DashboardTab | null;
    }
  | { type: 'SET_STRUCTURE_SEARCH'; query: string }
  | {
      type: 'OPEN_PARTNERS';
      focus?: boolean;
      minPersonalBB?: string | null;
      directOnly?: boolean;
    }
  | { type: 'CLEAR_PARTNERS_FOCUS' }
  | { type: 'SET_TOAST'; message: string | null }
  | { type: 'CLEAR' };

const initialState: SessionState = {
  view: 'upload',
  tab: 'overview',
  report: null,
  rootPartnerNumber: null,
  selectedPartnerNumber: null,
  structureSearch: '',
  importError: null,
  isParsing: false,
  cardReturnTab: null,
  partnersIntent: { focusToken: 0, minPersonalBB: null, directOnly: false },
  toastMessage: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'PARSE_START':
      return {
        ...initialState,
        isParsing: true,
      };
    case 'PARSE_SUCCESS': {
      const firstNumber =
        action.report.partners.find((p) => p.partnerNumber)?.partnerNumber ??
        null;
      if (!action.report.validation.ok || !firstNumber) {
        return {
          ...initialState,
          importError:
            action.report.validation.criticalErrors[0] ??
            'В файле не удалось определить партнёров.',
          isParsing: false,
        };
      }
      return {
        ...initialState,
        view: 'dashboard',
        tab: 'overview',
        report: action.report,
        rootPartnerNumber: firstNumber,
        selectedPartnerNumber: firstNumber,
        isParsing: false,
      };
    }
    case 'PARSE_ERROR':
      return {
        ...initialState,
        importError: action.message,
        isParsing: false,
      };
    case 'CONFIRM_ROOT':
      return {
        ...state,
        rootPartnerNumber: action.partnerNumber,
        selectedPartnerNumber: action.partnerNumber,
        view: 'dashboard',
        tab: 'overview',
        cardReturnTab: null,
      };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_TAB':
      return { ...state, tab: action.tab };
    case 'SELECT_PARTNER':
      return {
        ...state,
        selectedPartnerNumber: action.partnerNumber,
        tab: action.partnerNumber ? 'card' : state.tab,
        cardReturnTab:
          action.partnerNumber != null
            ? (action.returnTab ?? state.tab)
            : state.cardReturnTab,
      };
    case 'SET_STRUCTURE_SEARCH':
      return { ...state, structureSearch: action.query };
    case 'OPEN_PARTNERS':
      return {
        ...state,
        tab: 'partners',
        partnersIntent: {
          focusToken: action.focus
            ? state.partnersIntent.focusToken + 1
            : state.partnersIntent.focusToken,
          minPersonalBB:
            action.minPersonalBB === undefined
              ? state.partnersIntent.minPersonalBB
              : action.minPersonalBB,
          directOnly:
            action.directOnly === undefined
              ? state.partnersIntent.directOnly
              : action.directOnly,
        },
      };
    case 'CLEAR_PARTNERS_FOCUS':
      return {
        ...state,
        partnersIntent: {
          ...state.partnersIntent,
          focusToken: 0,
        },
      };
    case 'SET_TOAST':
      return { ...state, toastMessage: action.message };
    case 'CLEAR':
      return { ...initialState };
    default:
      return state;
  }
}

type SessionContextValue = {
  state: SessionState;
  index: PartnerIndex | null;
  hasSponsorField: boolean;
  loadFile: (file: File) => Promise<void>;
  confirmRoot: (partnerNumber: string) => boolean;
  clearData: () => void;
  setView: (view: AppView) => void;
  setTab: (tab: DashboardTab) => void;
  selectPartner: (
    partnerNumber: string | null,
    returnTab?: DashboardTab | null,
  ) => void;
  setStructureSearch: (query: string) => void;
  changeRoot: () => void;
  openPartners: (options?: {
    focus?: boolean;
    minPersonalBB?: string | null;
    directOnly?: boolean;
  }) => void;
  clearPartnersFocus: () => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const index = useMemo(() => {
    if (!state.report) return null;
    return buildPartnerIndex(state.report.partners);
  }, [state.report]);

  const hasSponsorField = Boolean(
    state.report?.validation.required.sponsorLink,
  );

  const loadFile = useCallback(async (file: File) => {
    clearBrowserReportTraces();
    dispatch({ type: 'PARSE_START' });
    try {
      const report = await parseWorkbookFile(file);
      dispatch({ type: 'PARSE_SUCCESS', report });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось обработать файл.';
      dispatch({ type: 'PARSE_ERROR', message });
    }
  }, []);

  const confirmRoot = useCallback(
    (partnerNumber: string): boolean => {
      if (!index?.byNumber.has(partnerNumber)) {
        return false;
      }
      dispatch({ type: 'CONFIRM_ROOT', partnerNumber });
      return true;
    },
    [index],
  );

  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    clearBrowserReportTraces();
  }, []);

  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SET_TOAST', message });
  }, []);

  const dismissToast = useCallback(() => {
    dispatch({ type: 'SET_TOAST', message: null });
  }, []);

  useEffect(() => {
    if (!state.toastMessage) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'SET_TOAST', message: null });
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [state.toastMessage]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      index,
      hasSponsorField,
      loadFile,
      confirmRoot,
      clearData,
      setView: (view) => dispatch({ type: 'SET_VIEW', view }),
      setTab: (tab) => dispatch({ type: 'SET_TAB', tab }),
      selectPartner: (partnerNumber, returnTab) =>
        dispatch({ type: 'SELECT_PARTNER', partnerNumber, returnTab }),
      setStructureSearch: (query) =>
        dispatch({ type: 'SET_STRUCTURE_SEARCH', query }),
      changeRoot: () => dispatch({ type: 'SET_VIEW', view: 'select-root' }),
      openPartners: (options) =>
        dispatch({
          type: 'OPEN_PARTNERS',
          focus: options?.focus,
          minPersonalBB: options?.minPersonalBB,
          directOnly: options?.directOnly,
        }),
      clearPartnersFocus: () => dispatch({ type: 'CLEAR_PARTNERS_FOCUS' }),
      showToast,
      dismissToast,
    }),
    [
      state,
      index,
      hasSponsorField,
      loadFile,
      confirmRoot,
      clearData,
      showToast,
      dismissToast,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession должен использоваться внутри SessionProvider');
  }
  return ctx;
}
