import styles from '../styles/app.module.css';
import type { PartnerSearchHit } from '../features/partners/searchPartners';
import { formatNumber } from '../utils/formatters';

type Props = {
  hits: PartnerSearchHit[];
  onSelect: (partnerNumber: string) => void;
};

export function PartnerTable({ hits, onSelect }: Props) {
  if (hits.length === 0) {
    return <p className={styles.muted}>Нет результатов по текущему запросу.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Номер</th>
            <th>ФИО</th>
            <th>Спонсор</th>
            <th>ББ личн</th>
            <th>ББ в ПГ</th>
          </tr>
        </thead>
        <tbody>
          {hits.map(({ partner, exactNumber }) => (
            <tr
              key={partner.partnerNumber + String(exactNumber)}
              className={exactNumber ? styles.tableExact : undefined}
              onClick={() => onSelect(partner.partnerNumber)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(partner.partnerNumber);
                }
              }}
              tabIndex={0}
              role="button"
            >
              <td>
                {partner.partnerNumber}
                {exactNumber ? (
                  <span className={styles.chip} style={{ marginLeft: 8 }}>
                    точное совпадение
                  </span>
                ) : null}
              </td>
              <td>{partner.fullName ?? 'Нет данных'}</td>
              <td>{partner.sponsorNumber ?? 'Нет данных'}</td>
              <td>{formatNumber(partner.personalBB)}</td>
              <td>{formatNumber(partner.groupBB)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
