import styles from '../styles/app.module.css';
import type { MetricCardData } from '../features/analytics/calculateMetrics';
import { formatNumber } from '../utils/formatters';

const scopeLabel = {
  report: 'Весь отчёт',
  structure: 'Структура выбранного партнёра',
} as const;

export function MetricCard({ metric }: { metric: MetricCardData }) {
  return (
    <article className={styles.metric} title={metric.source}>
      <div className={styles.metricLabel}>{metric.title}</div>
      <div className={styles.metricValue}>{formatNumber(metric.value)}</div>
      <div className={styles.metricScope}>{scopeLabel[metric.scope]}</div>
      {metric.note ? (
        <div className={styles.metricScope}>{metric.note}</div>
      ) : null}
    </article>
  );
}
