/** Нормализация телефона к цифрам; для РФ 8XXXXXXXXXX → 7XXXXXXXXXX */
export function normalizePhoneDigits(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    return `7${digits}`;
  }
  return digits;
}

export function buildTelLink(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return digits ? `tel:+${digits}` : `tel:${phone}`;
}

/** Telegram: открывает чат, если номер привязан и доступен для поиска */
export function buildTelegramLink(phone: string): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits || digits.length < 10) return null;
  return `https://t.me/+${digits}`;
}

/**
 * У Max нет публичного deep link по номеру телефона.
 * Открываем веб-клиент; номер копируется отдельно для поиска внутри приложения.
 */
export function buildMaxAppUrl(): string {
  return 'https://web.max.ru/';
}

export type MessengerAction = 'call' | 'telegram' | 'max' | 'copy';
