import styles from '../styles/app.module.css';
import { useSession } from '../context/SessionContext';

export function Toast() {
  const { state } = useSession();
  if (!state.toastMessage) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {state.toastMessage}
    </div>
  );
}
