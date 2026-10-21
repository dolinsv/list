import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Copy, MessageCircle, Phone, Send } from 'lucide-react';
import styles from '../styles/app.module.css';
import { copyText } from '../utils/formatters';
import {
  buildMaxAppUrl,
  buildTelLink,
  buildTelegramLink,
  normalizePhoneDigits,
} from '../utils/phoneLinks';
import { useSession } from '../context/SessionContext';

type Props = {
  phone: string;
};

export function PhoneActions({ phone }: Props) {
  const { showToast } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const digits = normalizePhoneDigits(phone);
  const telegram = buildTelegramLink(phone);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const onCall = () => {
    window.location.href = buildTelLink(phone);
    setOpen(false);
  };

  const onTelegram = () => {
    if (!telegram) {
      showToast('Некорректный номер для Telegram');
      return;
    }
    openExternal(telegram);
    showToast(
      'Открываем Telegram. Если чат не найден — номер скрыт или не зарегистрирован.',
    );
  };

  const onMax = async () => {
    const value = digits ? `+${digits}` : phone;
    const copied = await copyText(value);
    openExternal(buildMaxAppUrl());
    showToast(
      copied
        ? 'Номер скопирован. В Max: поиск → «Найти по номеру».'
        : 'Откройте Max и найдите контакт по номеру вручную.',
    );
  };

  const onCopy = async () => {
    const value = digits ? `+${digits}` : phone;
    const ok = await copyText(value);
    showToast(ok ? 'Телефон скопирован' : 'Не удалось скопировать');
    setOpen(false);
  };

  return (
    <div className={styles.phoneActions} ref={rootRef}>
      <button
        type="button"
        className={styles.phoneTrigger}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{phone}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <div className={styles.phoneMenu} id={menuId} role="menu">
          <p className={styles.phoneMenuNote}>
            Приложение не проверяет регистрацию в мессенджерах на сервере —
            открывается выбранный клиент на вашем устройстве.
          </p>
          <button type="button" className={styles.phoneMenuItem} role="menuitem" onClick={onCall}>
            <Phone size={15} strokeWidth={2} />
            Позвонить
          </button>
          <button
            type="button"
            className={styles.phoneMenuItem}
            role="menuitem"
            onClick={onTelegram}
            disabled={!telegram}
          >
            <Send size={15} strokeWidth={2} />
            Открыть в Telegram
          </button>
          <button type="button" className={styles.phoneMenuItem} role="menuitem" onClick={() => void onMax()}>
            <MessageCircle size={15} strokeWidth={2} />
            Найти в Max
          </button>
          <button type="button" className={styles.phoneMenuItem} role="menuitem" onClick={() => void onCopy()}>
            <Copy size={15} strokeWidth={2} />
            Копировать номер
          </button>
        </div>
      ) : null}
    </div>
  );
}
