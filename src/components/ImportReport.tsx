import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';

export function ImportReport() {
  const { state, setView, clearData } = useSession();
  const report = state.report;
  if (!report) return null;

  const { validation } = report;

  const stats = [
    { label: 'Строк', value: validation.rowCount },
    { label: 'Партнёров', value: validation.partnerCount },
    { label: 'Уникальных номеров', value: validation.uniqueNumbers },
    { label: 'Пропуски полей', value: validation.missingKeyFields },
    { label: 'Дубликаты номеров', value: validation.duplicateNumbers },
    { label: 'Колонок распознано', value: validation.mappedColumns.length },
  ];

  return (
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Проверка отчёта</h2>
      <p className={styles.sectionLead}>
        Файл обработан локально. Перед анализом убедитесь, что структура
        распознана верно.
      </p>

      <div className={styles.fileBanner}>
        <span className={styles.fileBannerLabel}>Файл</span>
        <span className={styles.fileBannerName}>{validation.fileName}</span>
        {(report.catalogLabel || report.reportDate) && (
          <span className={styles.muted} style={{ marginTop: 4 }}>
            {report.catalogLabel ? `Каталог ${report.catalogLabel}` : ''}
            {report.catalogLabel && report.reportDate ? ' · ' : ''}
            {report.reportDate ? `отчёт ${report.reportDate}` : ''}
          </span>
        )}
      </div>

      <div className={styles.statsGrid}>
        {stats.map((item) => (
          <article className={styles.metricCard} key={item.label}>
            <div className={styles.metricLabel}>{item.label}</div>
            <div className={styles.metricValue}>{item.value}</div>
          </article>
        ))}
      </div>

      <details className={styles.accordion} style={{ marginTop: 20 }}>
        <summary className={styles.accordionSummary}>
          Распознанные колонки
          <span className={styles.muted}>{validation.mappedColumns.length}</span>
        </summary>
        <div className={styles.accordionBody}>
          <ul className={styles.list}>
            {validation.mappedColumns.map((col) => (
              <li key={`${col.field}-${col.columnIndex}`}>
                <strong>{col.header}</strong>
                <span className={styles.muted}> → {col.field}</span>
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

      <div className={styles.footerBar}>
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
