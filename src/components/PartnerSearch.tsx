import { useDeferredValue, useMemo, useState } from 'react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { searchPartners } from '../features/partners/searchPartners';
import { PartnerTable } from './PartnerTable';

const PAGE_SIZE = 50;

export function PartnerSearch() {
  const { state, selectPartner } = useSession();
  const [query, setQuery] = useState('');
  const [hasContacts, setHasContacts] = useState<'any' | 'yes' | 'no'>('any');
  const [minPersonalBB, setMinPersonalBB] = useState('');
  const [page, setPage] = useState(0);
  const deferredQuery = useDeferredValue(query);

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
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Партнёры</h2>
      <p className={styles.panelLead}>
        Поиск по номеру и ФИО выполняется только в памяти браузера. Запрос не
        попадает в адресную строку.
      </p>

      <div className={styles.row}>
        <div className={styles.field} style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="partner-query">Номер или ФИО</label>
          <input
            id="partner-query"
            className={styles.input}
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Например, 3270 или Иванова"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="contacts-filter">Контакты</label>
          <select
            id="contacts-filter"
            className={styles.input}
            value={hasContacts}
            onChange={(e) => {
              setHasContacts(e.target.value as 'any' | 'yes' | 'no');
              setPage(0);
            }}
          >
            <option value="any">Любые</option>
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
            placeholder="0"
          />
        </div>
      </div>

      <p className={styles.muted}>Найдено: {hits.length}</p>

      <PartnerTable
        hits={pageHits}
        onSelect={(number) => selectPartner(number)}
      />

      <div className={styles.pager}>
        <button
          type="button"
          className={styles.btnGhost}
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
          className={styles.btnGhost}
          disabled={safePage >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        >
          Вперёд
        </button>
      </div>
    </section>
  );
}
