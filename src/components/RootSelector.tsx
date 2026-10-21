import { useMemo, useState } from 'react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { formatPartnerLabel } from '../utils/formatters';

export function RootSelector() {
  const { state, index, confirmRoot, setView, clearData } = useSession();
  const suggested = state.report?.validation.suggestedRootNumber ?? '';
  const [value, setValue] = useState(suggested);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const number = value.trim();
    if (!number || !index) return null;
    return index.byNumber.get(number) ?? null;
  }, [value, index]);

  const onConfirm = () => {
    const number = value.trim();
    if (!number) {
      setError('Введите номер партнёра.');
      return;
    }
    const ok = confirmRoot(number);
    if (!ok) {
      setError(
        'Этот номер не найден в отчёте. Проверьте ввод или вернитесь к проверке файла.',
      );
      return;
    }
    setError(null);
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Ваш номер партнёра</h2>
      <p className={styles.sectionLead}>
        Подтвердите, кто будет корнем анализа. Автоматический выбор без вашего
        согласия не выполняется.
      </p>

      {suggested ? (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          Предложение из отчёта:{' '}
          <strong>
            {formatPartnerLabel(
              suggested,
              state.report?.validation.suggestedRootName ?? null,
            )}
          </strong>
        </div>
      ) : null}

      <div className={styles.field} style={{ marginTop: 16 }}>
        <label htmlFor="root-number">Номер партнёра</label>
        <input
          id="root-number"
          className={styles.input}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/[^\d]/g, ''));
            setError(null);
          }}
          placeholder="Например, 12345678"
        />
      </div>

      <div className={styles.field} style={{ marginTop: 12 }}>
        <label>Подтверждение ФИО</label>
        <div
          className={styles.panelTight}
          style={{
            background: 'var(--surface-muted)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
          }}
        >
          <strong>
            {preview?.fullName ??
              (value ? 'Номер не найден в отчёте' : 'Введите номер')}
          </strong>
        </div>
      </div>

      {error ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.row} style={{ marginTop: 20 }}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => setView('import')}
        >
          Назад
        </button>
        <button type="button" className={styles.btnGhost} onClick={clearData}>
          Очистить
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onConfirm}
          disabled={!preview}
        >
          Открыть анализ
        </button>
      </div>
    </section>
  );
}
