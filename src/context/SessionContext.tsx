import {
  createContext,
  useCallback,
  useContext,
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
  | { type: 'SELECT_PARTNER'; partnerNumber: string | null }
  | { type: 'SET_STRUCTURE_SEARCH'; query: string }
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
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'PARSE_START':
      return {
        ...initialState,
        isParsing: true,
      };
    case 'PARSE_SUCCESS':
      return {
        ...initialState,
        view: 'import',
        report: action.report,
        isParsing: false,
      };
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
      };
    case 'SET_STRUCTURE_SEARCH':
      return { ...state, structureSearch: action.query };
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
  selectPartner: (partnerNumber: string | null) => void;
  setStructureSearch: (query: string) => void;
  changeRoot: () => void;
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
      // Сообщение об ошибке не должно включать персональные данные файла
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
      selectPartner: (partnerNumber) =>
        dispatch({ type: 'SELECT_PARTNER', partnerNumber }),
      setStructureSearch: (query) =>
        dispatch({ type: 'SET_STRUCTURE_SEARCH', query }),
      changeRoot: () => dispatch({ type: 'SET_VIEW', view: 'select-root' }),
    }),
    [
      state,
      index,
      hasSponsorField,
      loadFile,
      confirmRoot,
      clearData,
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
