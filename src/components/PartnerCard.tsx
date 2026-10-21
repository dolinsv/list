import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Mail,
  Phone,
  UserRound,
  Network,
} from 'lucide-react';
import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { getDirectReports } from '../features/partners/buildPartnerIndex';
import { getLevelRelativeToRoot } from '../features/structure/calculateLevels';
import { copyText, formatNumber, getInitials } from '../utils/formatters';
import { decodePartnerStatus } from '../features/status/statusGlossary';
import { MetricCard } from './MetricCard';
import { PhoneActions } from './PhoneActions';
import { StatusDecode } from './StatusDecode';

const DIRECT_PREVIEW = 8;

export function PartnerCard() {
  const {
    state,
    index,
    selectPartner,
    setTab,
    hasSponsorField,
    showToast,
  } = useSession();
  const [directQuery, setDirectQuery] = useState('');
  const [showAllDirects, setShowAllDirects] = useState(false);

  const partner = state.selectedPartnerNumber
    ? index?.byNumber.get(state.selectedPartnerNumber)
    : undefined;

  const level = useMemo(() => {
    if (!index || !state.rootPartnerNumber || !partner) return null;
    return getLevelRelativeToRoot(
      index,
      state.rootPartnerNumber,
      partner.partnerNumber,
      hasSponsorField,
    );
  }, [index, state.rootPartnerNumber, partner, hasSponsorField]);

  if (!state.selectedPartnerNumber) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <strong>Партнёр не выбран</strong>
          Откройте человека из поиска или структуры
          <div className={styles.row} style={{ justifyContent: 'center', marginTop: 16 }}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setTab('partners')}
            >
              Перейти к поиску
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!index || !partner) {
    return (
      <section className={styles.panel}>
        <div className={`${styles.alert} ${styles.alertError}`}>
          Партнёр не найден в текущем отчёте.
        </div>
      </section>
    );
  }

  const sponsor = partner.sponsorNumber
    ? index.byNumber.get(partner.sponsorNumber)
    : undefined;
  const inviter = partner.inviterNumber
    ? index.byNumber.get(partner.inviterNumber)
    : undefined;
  const directs = hasSponsorField
    ? getDirectReports(index, partner.partnerNumber)
    : [];

  const filteredDirects = directs.filter((child) => {
    if (!directQuery.trim()) return true;
    const q = directQuery.trim().toLowerCase();
    return (
      child.partnerNumber.includes(q) ||
      (child.fullName ?? '').toLowerCase().includes(q)
    );
  });

  const visibleDirects = showAllDirects
    ? filteredDirects
    : filteredDirects.slice(0, DIRECT_PREVIEW);

  const extraMetrics: Array<{ label: string; value: string }> = [
    { label: 'ББ Бьюти', value: formatNumber(partner.beautyBB) },
    { label: 'Макс %', value: formatNumber(partner.maxPercent) },
    { label: 'ОП личн', value: formatNumber(partner.salesVolume) },
    { label: 'ОП в ПГ', value: formatNumber(partner.groupSalesVolume) },
    { label: 'ББ, Well.', value: formatNumber(partner.wellnessBB) },
    { label: 'ББ, NovAge', value: formatNumber(partner.novAgeBB) },
    { label: 'Прогр. Плюс', value: formatNumber(partner.programPlus) },
    { label: 'Команд. Бонус', value: formatNumber(partner.teamBonus) },
    { label: 'Команд. Бонус+', value: formatNumber(partner.teamBonusPlus) },
    { label: 'Реком. Бонус', value: formatNumber(partner.recommendBonus) },
    { label: 'Доп. Бонусы', value: formatNumber(partner.extraBonuses) },
    { label: 'Проср. долг', value: formatNumber(partner.overdueDebt) },
    { label: 'НК', value: formatNumber(partner.inactiveCatalogs) },
  ].filter((item) => item.value !== 'Нет данных');

  const onCopy = async (value: string, label: string) => {
    const ok = await copyText(value);
    showToast(ok ? `${label} скопирован` : 'Не удалось скопировать');
  };

  const goBack = () => {
    const tab = state.cardReturnTab ?? 'partners';
    setTab(tab === 'card' ? 'partners' : tab);
  };

  const statusDecoded = decodePartnerStatus(partner.status);

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <div className={styles.profileHead}>
          <div className={styles.profileTop}>
            <div className={styles.avatar} aria-hidden>
              {getInitials(partner.fullName)}
            </div>
            <div className={styles.profileMain}>
              <h2 className={styles.profileName}>
                {partner.fullName ?? 'ФИО не указано'}
              </h2>
              <div className={styles.profileMeta}>
                <span className={styles.chip}>№ {partner.partnerNumber}</span>
                {level != null ? (
                  <span className={`${styles.chip} ${styles.chipAccent}`}>
                    Ур. {level}
                  </span>
                ) : null}
                {statusDecoded?.matches.map((item) => (
                  <span
                    key={item.code}
                    className={styles.chip}
                    title={`${item.title}: ${item.description}`}
                  >
                    {item.code === '+' ? '(+)' : `(${item.code})`}
                  </span>
                ))}
                {statusDecoded &&
                statusDecoded.matches.length === 0 &&
                partner.status ? (
                  <span className={styles.chip}>{partner.status}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div
            className={styles.profileActions}
            style={{
              gridTemplateColumns: sponsor
                ? 'repeat(3, minmax(0, 1fr))'
                : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <button type="button" className={styles.btn} onClick={goBack}>
              <ArrowLeft size={16} strokeWidth={2} />
              Назад
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={() => void onCopy(partner.partnerNumber, 'Номер')}
            >
              <Copy size={16} strokeWidth={2} />
              Номер
            </button>
            {sponsor ? (
              <button
                type="button"
                className={styles.btn}
                onClick={() => selectPartner(sponsor.partnerNumber, 'card')}
              >
                <UserRound size={16} strokeWidth={2} />
                Спонсор
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.metricsRow}>
        <MetricCard label="Личные ББ" value={partner.personalBB} keepSlot />
        <MetricCard label="ББ в ПГ" value={partner.groupBB} keepSlot />
        <MetricCard label="%" value={partner.percent} keepSlot />
      </section>

      {(partner.phone || partner.email) && (
        <section className={styles.panel}>
          <h3 className={styles.blockTitle}>Контакты</h3>
          <div className={styles.contactList}>
            {partner.phone ? (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <Phone size={15} strokeWidth={2} />
                </span>
                <div className={styles.contactBody}>
                  <div className={styles.contactLabel}>
                    Телефон · нажмите, чтобы открыть мессенджер
                  </div>
                  <div className={styles.contactValue}>
                    <PhoneActions phone={partner.phone} />
                  </div>
                </div>
              </div>
            ) : null}
            {partner.email ? (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <Mail size={15} strokeWidth={2} />
                </span>
                <div className={styles.contactBody}>
                  <div className={styles.contactLabel}>Электронная почта</div>
                  <div className={styles.contactValue}>
                    <a href={`mailto:${partner.email}`}>{partner.email}</a>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Копировать email"
                  onClick={() => void onCopy(partner.email!, 'Email')}
                >
                  <Copy size={14} strokeWidth={2} />
                </button>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {(partner.registrationCatalog || partner.status) && (
        <section className={styles.panel}>
          <h3 className={styles.blockTitle}>Информация о партнёре</h3>
          {partner.registrationCatalog ? (
            <div className={styles.kvGrid} style={{ marginBottom: partner.status ? 16 : 0 }}>
              <dl className={styles.kv}>
                <dt>Каталог присоединения</dt>
                <dd>{partner.registrationCatalog}</dd>
              </dl>
            </div>
          ) : null}
          <StatusDecode status={partner.status} />
        </section>
      )}

      <section className={styles.panel}>
        <h3 className={styles.blockTitle}>Связи в команде</h3>
        <div className={styles.relationGrid}>
          <div className={styles.relationCard}>
            <div className={styles.relationRole}>Спонсор</div>
            {partner.sponsorNumber ? (
              sponsor ? (
                <>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() =>
                      selectPartner(sponsor.partnerNumber, 'card')
                    }
                  >
                    {sponsor.fullName ?? sponsor.partnerNumber}
                  </button>
                  <span className={styles.muted}>№ {sponsor.partnerNumber}</span>
                </>
              ) : (
                <>
                  <strong>№ {partner.sponsorNumber}</strong>
                  <span className={styles.muted}>Нет в загруженном отчёте</span>
                </>
              )
            ) : (
              <span className={styles.muted}>Нет данных</span>
            )}
          </div>
          <div className={styles.relationCard}>
            <div className={styles.relationRole}>Пригласивший</div>
            {partner.inviterNumber ? (
              inviter ? (
                <>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() =>
                      selectPartner(inviter.partnerNumber, 'card')
                    }
                  >
                    {inviter.fullName ?? inviter.partnerNumber}
                  </button>
                  <span className={styles.muted}>№ {inviter.partnerNumber}</span>
                </>
              ) : (
                <>
                  <strong>№ {partner.inviterNumber}</strong>
                  <span className={styles.muted}>Нет в загруженном отчёте</span>
                </>
              )
            ) : (
              <span className={styles.muted}>Нет данных</span>
            )}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.row} style={{ justifyContent: 'space-between' }}>
          <h3 className={styles.blockTitle} style={{ margin: 0 }}>
            Непосредственные партнёры
            {hasSponsorField ? (
              <span className={styles.chip} style={{ marginLeft: 8 }}>
                {directs.length}
              </span>
            ) : null}
          </h3>
          {hasSponsorField && directs.length > 0 ? (
            <button
              type="button"
              className={styles.btnSoft}
              onClick={() => {
                // Корень анализа не меняем — открываем структуру с поиском по этому человеку
                setTab('structure');
              }}
            >
              <Network size={16} strokeWidth={2} />
              Смотреть в структуре
            </button>
          ) : null}
        </div>

        {!hasSponsorField ? (
          <p className={styles.muted}>
            Поле спонсора не распознано — список нижестоящих недоступен.
          </p>
        ) : directs.length === 0 ? (
          <p className={styles.muted}>Нет непосредственных партнёров в отчёте.</p>
        ) : (
          <>
            {directs.length > DIRECT_PREVIEW ? (
              <div className={styles.field} style={{ marginBottom: 12 }}>
                <label htmlFor="direct-query">Поиск в списке</label>
                <input
                  id="direct-query"
                  className={styles.input}
                  value={directQuery}
                  onChange={(e) => {
                    setDirectQuery(e.target.value);
                    setShowAllDirects(true);
                  }}
                  placeholder="Номер или ФИО"
                  autoComplete="off"
                />
              </div>
            ) : null}
            <div className={styles.directList}>
              {visibleDirects.map((child) => (
                <button
                  key={child.partnerNumber}
                  type="button"
                  className={styles.directItem}
                  onClick={() => selectPartner(child.partnerNumber, 'card')}
                >
                  <div className={styles.nameCell}>
                    <span className={styles.namePrimary}>
                      {child.fullName ?? 'Без ФИО'}
                    </span>
                    <span className={styles.nameSecondary}>
                      {child.partnerNumber}
                    </span>
                  </div>
                  <div className={styles.directStats}>
                    ББ {formatNumber(child.personalBB)}
                    <br />
                    ПГ {formatNumber(child.groupBB)}
                  </div>
                </button>
              ))}
            </div>
            {!showAllDirects && filteredDirects.length > DIRECT_PREVIEW ? (
              <button
                type="button"
                className={styles.btnGhost}
                style={{ marginTop: 8 }}
                onClick={() => setShowAllDirects(true)}
              >
                Показать всех ({filteredDirects.length})
              </button>
            ) : null}
          </>
        )}
      </section>

      {extraMetrics.length > 0 ? (
        <details className={styles.accordion}>
          <summary className={styles.accordionSummary}>
            Все показатели отчёта
            <span className={styles.muted}>{extraMetrics.length}</span>
          </summary>
          <div className={styles.accordionBody}>
            <p className={styles.muted} style={{ marginTop: 0 }}>
              Названия сохранены как в исходном информационном листке.
            </p>
            <div className={styles.kvGrid}>
              {extraMetrics.map((item) => (
                <dl className={styles.kv} key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </dl>
              ))}
              {partner.percent != null ? (
                <dl className={styles.kv}>
                  <dt>%</dt>
                  <dd>{formatNumber(partner.percent)}</dd>
                </dl>
              ) : null}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
