import styles from '../styles/app.module.css';
import { formatNumber } from '../utils/formatters';
import { Hint } from './Hint';

type Props = {
  label: string;
  value: number | null;
  hint?: string;
};

export function MetricCard({ label, value, hint }: Props) {
  if (value === null) return null;

  return (
    <article className={styles.metricCard}>
      <div className={styles.metricLabel}>
        <span>{label}</span>
        {hint ? <Hint text={hint} /> : null}
      </div>
      <div className={styles.metricValue}>{formatNumber(value)}</div>
    </article>
  );
}
