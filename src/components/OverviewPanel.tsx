import { useMemo, useState } from 'react';
import { ChevronDown, Search, Network, Activity } from 'lucide-react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { calculateMetrics } from '../features/analytics/calculateMetrics';
import { calculateLevelsRelativeToRoot } from '../features/structure/calculateLevels';
import { getDirectReports } from '../features/partners/buildPartnerIndex';
import { MetricCard } from './MetricCard';

type InsightId = 'direct' | 'nonzero' | 'warnings' | 'branches';

export function OverviewPanel() {
  const { state, index, hasSponsorField, openPartners, setTab } = useSession();
  const rootNumber = state.rootPartnerNumber;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openInsight, setOpenInsight] = useState<InsightId | null>(null);

  const metrics = useMemo(() => {
    if (!index || !rootNumber) return null;
    return calculateMetrics(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  const levels = useMemo(() => {
    if (!index || !rootNumber || !hasSponsorField) return [];
    return calculateLevelsRelativeToRoot(index, rootNumber, hasSponsorField);
  }, [index, rootNumber, hasSponsorField]);

  const attentionWarnings = useMemo(() => {
    const warnings = state.report?.validation.warnings ?? [];
    return warnings.filter((w) =>
      [
        'missing_sponsors',
        'cycles',
        'self_sponsor',
        'empty_numbers',
        'duplicate_numbers',
      ].includes(w.code),
    );
  }, [state.report]);

  const attentionCount = attentionWarnings.reduce(
    (sum, w) => sum + (w.count ?? 0),
    0,
  );

  if (!metrics || !rootNumber) return null;

  const byId = Object.fromEntries(metrics.cards.map((c) => [c.id, c]));
  const directCount = byId.direct_count?.value ?? null;
  const nonzero = byId.nonzero_personal_bb?.value ?? null;
  const hasPersonalBB = metrics.root?.personalBB !== null;
  const branchCount =
    index && rootNumber ? getDirectReports(index, rootNumber).length : 0;
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
      label: 'Я спонсор',
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

  const toggleInsight = (id: InsightId) => {
    setOpenInsight((current) => (current === id ? null : id));
  };

  return (
    <div className={styles.stack}>
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
            onClick={() =>
              openPartners({
                focus: true,
                minPersonalBB: null,
                directOnly: false,
              })
            }
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
                directOnly: false,
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
            <li className={styles.infoItem}>
              <button
                type="button"
                className={styles.infoRowBtn}
                aria-expanded={openInsight === 'direct'}
                onClick={() => toggleInsight('direct')}
              >
                <span>Я спонсор</span>
                <span className={styles.infoRowValue}>
                  <strong>{directCount}</strong>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={
                      openInsight === 'direct'
                        ? styles.infoChevronOpen
                        : styles.infoChevron
                    }
                    aria-hidden
                  />
                </span>
              </button>
              {openInsight === 'direct' ? (
                <div className={styles.infoDetail}>
                  <p>
                    Партнёры первого уровня: в поле «Спонсор» указан ваш номер.
                  </p>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() =>
                      openPartners({
                        focus: true,
                        minPersonalBB: null,
                        directOnly: true,
                      })
                    }
                  >
                    Открыть список
                  </button>
                </div>
              ) : null}
            </li>
          ) : null}

          {nonzero != null ? (
            <li className={styles.infoItem}>
              <button
                type="button"
                className={styles.infoRowBtn}
                aria-expanded={openInsight === 'nonzero'}
                onClick={() => toggleInsight('nonzero')}
              >
                <span>С ненулевыми личными ББ в структуре</span>
                <span className={styles.infoRowValue}>
                  <strong>{nonzero}</strong>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={
                      openInsight === 'nonzero'
                        ? styles.infoChevronOpen
                        : styles.infoChevron
                    }
                    aria-hidden
                  />
                </span>
              </button>
              {openInsight === 'nonzero' ? (
                <div className={styles.infoDetail}>
                  <p>
                    Партнёры в вашей структуре с личными ББ больше нуля. Пустое
                    значение в отчёте не считается нулём.
                  </p>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() =>
                      openPartners({
                        focus: true,
                        minPersonalBB: '1',
                        directOnly: false,
                      })
                    }
                  >
                    Открыть список
                  </button>
                </div>
              ) : null}
            </li>
          ) : null}

          {attentionCount > 0 ? (
            <li className={styles.infoItem}>
              <button
                type="button"
                className={styles.infoRowBtn}
                aria-expanded={openInsight === 'warnings'}
                onClick={() => toggleInsight('warnings')}
              >
                <span>Записей с замечаниями по связям или номерам</span>
                <span className={styles.infoRowValue}>
                  <strong>{attentionCount}</strong>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={
                      openInsight === 'warnings'
                        ? styles.infoChevronOpen
                        : styles.infoChevron
                    }
                    aria-hidden
                  />
                </span>
              </button>
              {openInsight === 'warnings' ? (
                <div className={styles.infoDetail}>
                  <ul className={styles.infoDetailList}>
                    {attentionWarnings.map((w) => (
                      <li key={w.code}>
                        {w.message}
                        {w.count != null ? (
                          <strong> · {w.count}</strong>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ) : (
            <li className={styles.infoItem}>
              <div className={styles.infoRowStatic}>
                <span>Критичных проблем со связями не отмечено</span>
                <strong>—</strong>
              </div>
            </li>
          )}

          {hasSponsorField ? (
            <li className={styles.infoItem}>
              <button
                type="button"
                className={styles.infoRowBtn}
                aria-expanded={openInsight === 'branches'}
                onClick={() => toggleInsight('branches')}
              >
                <span>Прямых веток у корня</span>
                <span className={styles.infoRowValue}>
                  <strong>{branchCount}</strong>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={
                      openInsight === 'branches'
                        ? styles.infoChevronOpen
                        : styles.infoChevron
                    }
                    aria-hidden
                  />
                </span>
              </button>
              {openInsight === 'branches' ? (
                <div className={styles.infoDetail}>
                  <p>
                    Сколько непосредственных веток начинается от выбранного
                    корня в дереве структуры.
                  </p>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => setTab('structure')}
                  >
                    Открыть структуру
                  </button>
                </div>
              ) : null}
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
