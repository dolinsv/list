import { useId, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import styles from '../styles/app.module.css';

export function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <button
      type="button"
      className={styles.hintBtn}
      aria-label="Подсказка"
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        e.preventDefault();
        setOpen((v) => !v);
      }}
    >
      <HelpCircle size={14} strokeWidth={2} />
      {open ? (
        <span className={styles.hintBubble} id={id} role="tooltip">
          {text}
        </span>
      ) : null}
    </button>
  );
}
