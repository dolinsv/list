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
        'Выбранный номер не найден в загруженном отчёте. Проверьте ввод или вернитесь к проверке файла.',
      );
      return;
    }
    setError(null);
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Выбор собственного номера</h2>
      <p className={styles.panelLead}>
        Подтвердите, что выбранный партнёр — корень анализа. Автоматический
        выбор без подтверждения не выполняется.
      </p>

      {suggested ? (
        <div className={`${styles.alert} ${styles.alertOk}`}>
          Предложение:{' '}
          {formatPartnerLabel(
            suggested,
            state.report?.validation.suggestedRootName ?? null,
          )}
        </div>
      ) : null}

      <div className={styles.field}>
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

      <div className={styles.field}>
        <span>Подтверждение ФИО</span>
        <strong>
          {preview?.fullName ?? (value ? 'Номер не найден в отчёте' : '—')}
        </strong>
      </div>

      {error ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.row}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => setView('import')}
        >
          Назад к проверке
        </button>
        <button type="button" className={styles.btnGhost} onClick={clearData}>
          Очистить данные
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onConfirm}
          disabled={!preview}
        >
          Подтвердить и открыть анализ
        </button>
      </div>
    </section>
  );
}
