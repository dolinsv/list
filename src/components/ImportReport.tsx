import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';

export function ImportReport() {
  const { state, setView, clearData } = useSession();
  const report = state.report;
  if (!report) return null;

  const { validation } = report;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Проверка отчёта</h2>
      <p className={styles.panelLead}>
        Файл обработан локально. Ниже — результат распознавания без перехода к
        аналитике до вашего подтверждения.
      </p>

      <div className={styles.gridMetrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Файл</div>
          <div className={styles.metricValue} style={{ fontSize: '1rem' }}>
            {validation.fileName}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Строк данных</div>
          <div className={styles.metricValue}>{validation.rowCount}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Партнёров</div>
          <div className={styles.metricValue}>{validation.partnerCount}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Уникальных номеров</div>
          <div className={styles.metricValue}>{validation.uniqueNumbers}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Пропуски ключевых полей</div>
          <div className={styles.metricValue}>{validation.missingKeyFields}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Повторяющиеся номера</div>
          <div className={styles.metricValue}>{validation.duplicateNumbers}</div>
        </div>
      </div>

      {report.catalogLabel || report.reportDate ? (
        <p className={styles.muted}>
          {report.catalogLabel ? `Каталог отчёта: ${report.catalogLabel}. ` : ''}
          {report.reportDate ? `Дата отчёта: ${report.reportDate}.` : ''}
        </p>
      ) : null}

      <h3>Распознанные колонки</h3>
      <ul className={styles.list}>
        {validation.mappedColumns.map((col) => (
          <li key={`${col.field}-${col.columnIndex}`}>
            <strong>{col.header}</strong> → {col.field}
          </li>
        ))}
      </ul>

      {validation.criticalErrors.length > 0 ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <strong>Критические проблемы</strong>
          <ul className={styles.list}>
            {validation.criticalErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={`${styles.alert} ${styles.alertOk}`}>
          Обязательные поля для базового анализа распознаны. Можно выбрать свой
          номер партнёра.
        </div>
      )}

      {validation.warnings.length > 0 ? (
        <div className={`${styles.alert} ${styles.alertWarn}`}>
          <strong>Предупреждения</strong>
          <ul className={styles.list}>
            {validation.warnings.map((w) => (
              <li key={w.code + (w.message)}>
                {w.message}
                {typeof w.count === 'number' ? ` (${w.count})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.row}>
        <button type="button" className={styles.btnGhost} onClick={clearData}>
          Очистить данные
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={!validation.ok}
          onClick={() => setView('select-root')}
        >
          Выбрать свой номер
        </button>
      </div>
    </section>
  );
}
