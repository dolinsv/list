import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';
import { getDirectReports } from '../features/partners/buildPartnerIndex';
import {
  displayOrEmpty,
  formatNumber,
  formatPartnerLabel,
} from '../utils/formatters';

export function PartnerCard() {
  const { state, index, selectPartner, hasSponsorField } = useSession();
  if (!index || !state.selectedPartnerNumber) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Карточка партнёра</h2>
        <p className={styles.muted}>Выберите партнёра в списке или структуре.</p>
      </section>
    );
  }

  const partner = index.byNumber.get(state.selectedPartnerNumber);
  if (!partner) {
    return (
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Карточка партнёра</h2>
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

  const metrics: Array<{ label: string; value: string }> = [
    { label: 'Личные ББ', value: formatNumber(partner.personalBB) },
    { label: 'ББ Бьюти', value: formatNumber(partner.beautyBB) },
    { label: 'ББ в ПГ', value: formatNumber(partner.groupBB) },
    { label: '%', value: formatNumber(partner.percent) },
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
  ];

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>
        {formatPartnerLabel(partner.partnerNumber, partner.fullName)}
      </h2>
      <p className={styles.panelLead}>
        Показатели названы как в исходном отчёте. Пустые значения не заменяются
        нулём.
      </p>

      <div className={styles.cardGrid}>
        <dl className={styles.kv}>
          <dt>Номер партнёра</dt>
          <dd>{partner.partnerNumber}</dd>
        </dl>
        <dl className={styles.kv}>
          <dt>ФИО</dt>
          <dd>{displayOrEmpty(partner.fullName)}</dd>
        </dl>
        <dl className={styles.kv}>
          <dt>Каталог присоединения</dt>
          <dd>{displayOrEmpty(partner.registrationCatalog)}</dd>
        </dl>
        <dl className={styles.kv}>
          <dt>Телефон</dt>
          <dd>{displayOrEmpty(partner.phone)}</dd>
        </dl>
        <dl className={styles.kv}>
          <dt>Электронная почта</dt>
          <dd>{displayOrEmpty(partner.email)}</dd>
        </dl>
        <dl className={styles.kv}>
          <dt>Статус</dt>
          <dd>{displayOrEmpty(partner.status)}</dd>
        </dl>
        <dl className={styles.kv}>
          <dt>Каталог последнего заказа</dt>
          <dd>Нет данных в источнике MVP</dd>
        </dl>
      </div>

      <h3>Показатели</h3>
      <div className={styles.cardGrid}>
        {metrics.map((item) => (
          <dl className={styles.kv} key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </dl>
        ))}
      </div>

      <h3>Связи</h3>
      <div className={styles.stack}>
        <div>
          <span className={styles.muted}>Спонсор: </span>
          {partner.sponsorNumber ? (
            sponsor ? (
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => selectPartner(sponsor.partnerNumber)}
              >
                {formatPartnerLabel(sponsor.partnerNumber, sponsor.fullName)}
              </button>
            ) : (
              <span>
                {partner.sponsorNumber} (нет в загруженном отчёте)
              </span>
            )
          ) : (
            'Нет данных'
          )}
        </div>
        <div>
          <span className={styles.muted}>Пригласивший: </span>
          {partner.inviterNumber ? (
            inviter ? (
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => selectPartner(inviter.partnerNumber)}
              >
                {formatPartnerLabel(inviter.partnerNumber, inviter.fullName)}
              </button>
            ) : (
              <span>
                {partner.inviterNumber} (нет в загруженном отчёте)
              </span>
            )
          ) : (
            'Нет данных'
          )}
        </div>
      </div>

      <h3>Непосредственные нижестоящие</h3>
      {!hasSponsorField ? (
        <p className={styles.muted}>
          Поле спонсора не распознано — список нижестоящих недоступен.
        </p>
      ) : directs.length === 0 ? (
        <p className={styles.muted}>Нет непосредственных партнёров в отчёте.</p>
      ) : (
        <ul className={styles.list}>
          {directs.map((child) => (
            <li key={child.partnerNumber}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => selectPartner(child.partnerNumber)}
              >
                {formatPartnerLabel(child.partnerNumber, child.fullName)}
              </button>
              <span className={styles.muted}>
                {' '}
                · ББ личн {formatNumber(child.personalBB)} · ББ в ПГ{' '}
                {formatNumber(child.groupBB)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
