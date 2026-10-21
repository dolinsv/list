/**
 * Очистка сессии анализа.
 * Данные отчёта живут только в оперативной памяти React-состояния.
 * Этот модуль явно документирует запрет на постоянные хранилища.
 */
export function assertNoReportPersistence(): void {
  // Намеренно не читаем и не пишем отчёт в storage —
  // проверка используется в privacy-тестах и при очистке.
}

export function clearBrowserReportTraces(): void {
  assertNoReportPersistence();

  // Не трогаем localStorage/sessionStorage/IndexedDB/cookies/Cache Storage
  // содержимым отчёта: приложение туда данные отчёта не записывает.
  // URL не должен содержать персональные данные — хэш/query не используем для PII.
  if (typeof window !== 'undefined') {
    const { pathname, search, hash } = window.location;
    if (search || hash) {
      window.history.replaceState(null, '', pathname);
    }
  }
}

export const FORBIDDEN_STORAGE_KEYS_PREFIX = 'oriflame-report';
