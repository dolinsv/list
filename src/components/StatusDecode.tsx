import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import styles from '../styles/app.module.css';
import {
  decodePartnerStatus,
  STATUS_GLOSSARY,
} from '../features/status/statusGlossary';

type Props = {
  status: string | null | undefined;
};

export function StatusDecode({ status }: Props) {
  const [showLegend, setShowLegend] = useState(false);
  const decoded = decodePartnerStatus(status);

  if (!decoded) return null;

  return (
    <div className={styles.statusBlock}>
      <div className={styles.statusHeader}>
        <div>
          <div className={styles.metricLabel}>Статус в отчёте</div>
          <div className={styles.statusRaw}>{decoded.raw}</div>
        </div>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => setShowLegend((v) => !v)}
        >
          <BookOpen size={15} strokeWidth={2} />
          {showLegend ? 'Скрыть справочник' : 'Справочник статусов'}
        </button>
      </div>

      {decoded.matches.length > 0 ? (
        <ul className={styles.statusList}>
          {decoded.matches.map((item) => (
            <li key={item.code} className={styles.statusItem}>
              <span className={`${styles.chip} ${styles.chipAccent}`}>
                {item.code === '+' ? '(+)' : `(${item.code})`}
              </span>
              <div>
                <strong>{item.title}</strong>
                <div className={styles.muted}>{item.description}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>
          Известные коды в этой строке не распознаны. Откройте справочник ниже.
        </p>
      )}

      {decoded.unknownParts.length > 0 ? (
        <p className={styles.muted} style={{ marginTop: 8 }}>
          Нераспознанные фрагменты: {decoded.unknownParts.join(', ')}
        </p>
      ) : null}

      {showLegend ? (
        <div className={styles.statusLegend}>
          <div className={styles.blockTitle} style={{ marginBottom: 8 }}>
            Справочник меток Oriflame
          </div>
          <ul className={styles.statusList}>
            {STATUS_GLOSSARY.map((item) => (
              <li key={item.code} className={styles.statusItem}>
                <span className={styles.chip}>
                  {item.code === '+' ? '(+)' : `(${item.code})`}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.muted}>{item.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
