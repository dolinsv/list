import styles from '../styles/app.module.css';
import { formatNumber } from '../utils/formatters';
import { Hint } from './Hint';

type Props = {
  label: string;
  value: number | null;
  hint?: string;
  /** Показывать карточку даже без значения (для ровной сетки) */
  keepSlot?: boolean;
};

export function MetricCard({ label, value, hint, keepSlot = false }: Props) {
  if (value === null && !keepSlot) return null;

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
