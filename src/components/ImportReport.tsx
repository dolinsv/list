import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';

export function ImportReport() {
  const { state, setView, clearData } = useSession();
  const report = state.report;
  if (!report) return null;

  const { validation } = report;

  return (
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Проверка отчёта</h2>
      <p className={styles.sectionLead}>
        Файл обработан локально. Перед анализом убедитесь, что структура
        распознана верно.
      </p>

      <div className={styles.metricsGrid} style={{ marginBottom: 20 }}>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>Файл</div>
          <div className={styles.metricValue} style={{ fontSize: '1rem' }}>
            {validation.fileName}
          </div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>Строк</div>
          <div className={styles.metricValue}>{validation.rowCount}</div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>Партнёров</div>
          <div className={styles.metricValue}>{validation.partnerCount}</div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>Уникальных номеров</div>
          <div className={styles.metricValue}>{validation.uniqueNumbers}</div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>Пропуски полей</div>
          <div className={styles.metricValue}>{validation.missingKeyFields}</div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>Дубликаты номеров</div>
          <div className={styles.metricValue}>{validation.duplicateNumbers}</div>
        </article>
      </div>

      {(report.catalogLabel || report.reportDate) && (
        <p className={styles.muted}>
          {report.catalogLabel ? `Каталог: ${report.catalogLabel}. ` : ''}
          {report.reportDate ? `Дата отчёта: ${report.reportDate}.` : ''}
        </p>
      )}

      <details className={styles.accordion} style={{ marginTop: 12 }}>
        <summary className={styles.accordionSummary}>
          Распознанные колонки
          <span className={styles.muted}>{validation.mappedColumns.length}</span>
        </summary>
        <div className={styles.accordionBody}>
          <ul className={styles.list}>
            {validation.mappedColumns.map((col) => (
              <li key={`${col.field}-${col.columnIndex}`}>
                <strong>{col.header}</strong> → {col.field}
              </li>
            ))}
          </ul>
        </div>
      </details>

      {validation.criticalErrors.length > 0 ? (
        <div
          className={`${styles.alert} ${styles.alertError}`}
          role="alert"
          style={{ marginTop: 16 }}
        >
          <strong>Что мешает анализу</strong>
          <ul className={styles.list}>
            {validation.criticalErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>
            Загрузите другой файл или очистите данные и попробуйте снова.
          </div>
        </div>
      ) : (
        <div className={`${styles.alert} ${styles.alertOk}`} style={{ marginTop: 16 }}>
          Обязательные поля распознаны. Можно выбрать свой номер партнёра.
        </div>
      )}

      {validation.warnings.length > 0 ? (
        <div className={`${styles.alert} ${styles.alertWarn}`} style={{ marginTop: 12 }}>
          <strong>Предупреждения</strong>
          <ul className={styles.list}>
            {validation.warnings.map((w) => (
              <li key={w.code + w.message}>
                {w.message}
                {typeof w.count === 'number' ? ` (${w.count})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.row} style={{ marginTop: 20 }}>
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
