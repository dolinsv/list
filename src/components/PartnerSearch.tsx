import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Search } from 'lucide-react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { searchPartners } from '../features/partners/searchPartners';
import { PartnerTable } from './PartnerTable';

const PAGE_SIZE = 40;

export function PartnerSearch() {
  const { state, selectPartner, clearPartnersFocus } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [hasContacts, setHasContacts] = useState<'any' | 'yes' | 'no'>('any');
  const [minPersonalBB, setMinPersonalBB] = useState('');
  const [page, setPage] = useState(0);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const intent = state.partnersIntent;
    if (intent.minPersonalBB != null) {
      setMinPersonalBB(intent.minPersonalBB);
      setPage(0);
    }
    if (intent.focusToken > 0) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      clearPartnersFocus();
    }
  }, [state.partnersIntent, clearPartnersFocus]);

  const hits = useMemo(() => {
    const partners = state.report?.partners ?? [];
    return searchPartners(partners, {
      query: deferredQuery,
      hasContacts:
        hasContacts === 'any' ? null : hasContacts === 'yes' ? true : false,
      minPersonalBB: minPersonalBB ? Number(minPersonalBB) : null,
    });
  }, [state.report, deferredQuery, hasContacts, minPersonalBB]);

  const pageCount = Math.max(1, Math.ceil(hits.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageHits = hits.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <section className={styles.stack}>
      <div className={styles.panel}>
        <div className={styles.filtersRow}>
          <div className={styles.field}>
            <label htmlFor="partner-query">Поиск</label>
            <div className={styles.searchField}>
              <Search size={16} strokeWidth={2} aria-hidden />
              <input
                ref={inputRef}
                id="partner-query"
                className={styles.input}
                value={query}
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Номер или фамилия…"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="contacts-filter">Контакты</label>
            <select
              id="contacts-filter"
              className={`${styles.input} ${styles.select}`}
              value={hasContacts}
              onChange={(e) => {
                setHasContacts(e.target.value as 'any' | 'yes' | 'no');
                setPage(0);
              }}
            >
              <option value="any">Все</option>
              <option value="yes">Есть телефон или email</option>
              <option value="no">Без контактов</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="min-bb">Мин. личные ББ</label>
            <input
              id="min-bb"
              className={styles.input}
              inputMode="numeric"
              value={minPersonalBB}
              onChange={(e) => {
                setMinPersonalBB(e.target.value.replace(/[^\d]/g, ''));
                setPage(0);
              }}
              placeholder="Любые"
            />
          </div>
        </div>

        <div className={styles.resultMeta}>
          <span className={styles.muted}>
            Найдено: <strong>{hits.length}</strong>
          </span>
          {(query || hasContacts !== 'any' || minPersonalBB) && (
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => {
                setQuery('');
                setHasContacts('any');
                setMinPersonalBB('');
                setPage(0);
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </div>

        <PartnerTable
          hits={pageHits}
          onSelect={(number) => selectPartner(number, 'partners')}
        />

        {hits.length > PAGE_SIZE ? (
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.btn}
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Назад
            </button>
            <span className={styles.muted}>
              Страница {safePage + 1} из {pageCount}
            </span>
            <button
              type="button"
              className={styles.btn}
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Вперёд
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
