import { useMemo } from 'react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { calculateMetrics } from '../features/analytics/calculateMetrics';
import { calculateCharts } from '../features/analytics/calculateCharts';
import { MetricCard } from './MetricCard';
import { ChartsPanel } from './ChartsPanel';
import { formatPartnerLabel } from '../utils/formatters';

export function OverviewPanel() {
  const { state, index, hasSponsorField } = useSession();
  const rootNumber = state.rootPartnerNumber;

  const metrics = useMemo(() => {
    if (!index || !rootNumber) return null;
    return calculateMetrics(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  const charts = useMemo(() => {
    if (!index || !rootNumber) return null;
    return calculateCharts(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  if (!metrics || !charts || !rootNumber) return null;

  return (
    <section className={styles.stack}>
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Сводная панель</h2>
        <p className={styles.panelLead}>
          Корень анализа:{' '}
          <strong>
            {formatPartnerLabel(
              rootNumber,
              metrics.root?.fullName ?? null,
            )}
          </strong>
          . Рядом с метриками указана область расчёта: весь отчёт или структура
          выбранного партнёра.
        </p>
        <div className={styles.gridMetrics}>
          {metrics.cards.map((card) => (
            <MetricCard key={card.id} metric={card} />
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Графики</h2>
        <p className={styles.panelLead}>
          Графики строятся только при наличии необходимых показателей. Групповые
          ББ корня не суммируются повторно по нижестоящим.
        </p>
        <ChartsPanel data={charts} />
      </div>
    </section>
  );
}
