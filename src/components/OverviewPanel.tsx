import { useMemo, useState } from 'react';
import { Search, Network, Activity } from 'lucide-react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { calculateMetrics } from '../features/analytics/calculateMetrics';
import { calculateLevelsRelativeToRoot } from '../features/structure/calculateLevels';
import { getDirectReports } from '../features/partners/buildPartnerIndex';
import { MetricCard } from './MetricCard';
import { formatPartnerLabel } from '../utils/formatters';

export function OverviewPanel() {
  const { state, index, hasSponsorField, openPartners, setTab } = useSession();
  const rootNumber = state.rootPartnerNumber;
  const [detailsOpen, setDetailsOpen] = useState(false);

  const metrics = useMemo(() => {
    if (!index || !rootNumber) return null;
    return calculateMetrics(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  const levels = useMemo(() => {
    if (!index || !rootNumber || !hasSponsorField) return [];
    return calculateLevelsRelativeToRoot(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  const attentionCount = useMemo(() => {
    const warnings = state.report?.validation.warnings ?? [];
    return warnings
      .filter((w) =>
        ['missing_sponsors', 'cycles', 'self_sponsor', 'empty_numbers', 'duplicate_numbers'].includes(
          w.code,
        ),
      )
      .reduce((sum, w) => sum + (w.count ?? 0), 0);
  }, [state.report]);

  if (!metrics || !rootNumber) return null;

  const byId = Object.fromEntries(metrics.cards.map((c) => [c.id, c]));
  const directCount = byId.direct_count?.value ?? null;
  const nonzero = byId.nonzero_personal_bb?.value ?? null;
  const hasPersonalBB = metrics.root?.personalBB !== null;
  const maxLevelCount = Math.max(1, ...levels.map((l) => l.count));
  const showLevels =
    hasSponsorField &&
    levels.length > 1 &&
    levels.length <= 20 &&
    levels.some((l) => l.level > 0);

  const overviewCards = [
    {
      id: 'structure_count',
      label: 'В моей структуре',
      hint: 'Сколько партнёров находится ниже вас по спонсорским связям в этом отчёте, включая вас.',
    },
    {
      id: 'direct_count',
      label: 'Непосредственные',
      hint: 'Партнёры первого уровня: у них в поле «Спонсор» указан ваш номер.',
    },
    {
      id: 'personal_bb',
      label: 'Личные ББ',
      hint: 'Баллы бонуса за ваши личные покупки в этом каталоге. Значение из отчёта Oriflame.',
    },
    {
      id: 'group_bb',
      label: 'ББ группы (ПГ)',
      hint: 'Баллы персональной группы из отчёта. Не суммируются повторно по нижестоящим.',
    },
    {
      id: 'nonzero_personal_bb',
      label: 'С личными ББ > 0',
      hint: 'Партнёры в структуре, у которых личные ББ больше нуля. Пустое значение не считается нулём.',
    },
  ] as const;

  return (
    <div className={styles.stack}>
      <section>
        <h2 className={styles.sectionTitle}>Моя структура</h2>
        <p className={styles.sectionLead}>
          Краткая картина вашей команды по загруженному отчёту.
        </p>
        <p className={styles.muted} style={{ marginTop: '-0.75rem' }}>
          Корень анализа:{' '}
          <strong>
            {formatPartnerLabel(rootNumber, metrics.root?.fullName ?? null)}
          </strong>
        </p>
      </section>

      <section className={styles.metricsGrid}>
        {overviewCards.map((card) => (
          <MetricCard
            key={card.id}
            label={card.label}
            value={byId[card.id]?.value ?? null}
            hint={card.hint}
          />
        ))}
      </section>

      <section className={styles.panel}>
        <h3 className={styles.blockTitle}>Что хотите сделать?</h3>
        <div className={styles.actionsGrid}>
          <button
            type="button"
            className={styles.actionCard}
            onClick={() => openPartners({ focus: true, minPersonalBB: null })}
          >
            <span className={styles.actionIcon}>
              <Search size={16} strokeWidth={2} />
            </span>
            <span className={styles.actionTitle}>Найти партнёра</span>
            <span className={styles.actionDesc}>
              Поиск по номеру или ФИО в загруженном отчёте
            </span>
          </button>
          <button
            type="button"
            className={styles.actionCard}
            onClick={() => setTab('structure')}
          >
            <span className={styles.actionIcon}>
              <Network size={16} strokeWidth={2} />
            </span>
            <span className={styles.actionTitle}>Посмотреть структуру</span>
            <span className={styles.actionDesc}>
              Дерево команды относительно выбранного корня
            </span>
          </button>
          <button
            type="button"
            className={styles.actionCard}
            onClick={() =>
              openPartners({
                focus: true,
                minPersonalBB: hasPersonalBB || nonzero != null ? '1' : null,
              })
            }
            disabled={nonzero == null && !hasPersonalBB}
          >
            <span className={styles.actionIcon}>
              <Activity size={16} strokeWidth={2} />
            </span>
            <span className={styles.actionTitle}>Найти с личными ББ</span>
            <span className={styles.actionDesc}>
              Список партнёров с личными ББ больше нуля
            </span>
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.blockTitle}>Полезные сведения</h3>
        <ul className={styles.infoList}>
          {directCount != null ? (
            <li>
              <span>Непосредственных партнёров</span>
              <strong>{directCount}</strong>
            </li>
          ) : null}
          {nonzero != null ? (
            <li>
              <span>С ненулевыми личными ББ в структуре</span>
              <strong>{nonzero}</strong>
            </li>
          ) : null}
          {attentionCount > 0 ? (
            <li>
              <span>Записей с замечаниями по связям или номерам</span>
              <strong>{attentionCount}</strong>
            </li>
          ) : (
            <li>
              <span>Критичных проблем со связями не отмечено</span>
              <strong>—</strong>
            </li>
          )}
          {hasSponsorField ? (
            <li>
              <span>Прямых веток у корня</span>
              <strong>
                {index && rootNumber
                  ? getDirectReports(index, rootNumber).length
                  : '—'}
              </strong>
            </li>
          ) : null}
        </ul>
      </section>

      {showLevels ? (
        <section className={styles.panel}>
          <button
            type="button"
            className={styles.detailsToggle}
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
          >
            <span>Подробнее: партнёры по уровням</span>
            <span>{detailsOpen ? 'Скрыть' : 'Открыть'}</span>
          </button>
          {detailsOpen ? (
            <div className={styles.detailsBody}>
              <p className={styles.muted} style={{ marginBottom: '0.85rem' }}>
                Уровни считаются от выбранного корня по полю «Спонсор», а не по
                колонке «Ур» из файла.
              </p>
              <div className={styles.levelsBars}>
                {levels.map((item) => (
                  <div className={styles.levelRow} key={item.level}>
                    <span>
                      {item.level === 0 ? 'Корень' : `Уровень ${item.level}`}
                    </span>
                    <div className={styles.levelBarTrack}>
                      <div
                        className={styles.levelBarFill}
                        style={{
                          width: `${Math.max(6, (item.count / maxLevelCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
