/** Сохраняет ведущие нули: идентификаторы всегда строки */
export function toPartnerId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    // Excel может отдать число — без научной нотации и без потери целой части
    return String(Math.trunc(value));
  }
  const raw = String(value).trim();
  if (!raw) return null;
  // Убираем пробелы/разделители тысяч, оставляем цифры
  const digits = raw.replace(/[^\d]/g, '');
  return digits || null;
}

/**
 * Разбор числовых показателей.
 * Отсутствие значения → null (не 0).
 */
export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  let raw = String(value).trim();
  if (!raw || raw === '-' || raw === '—') return null;

  raw = raw.replace(/\s+/g, '').replace(/\u00a0/g, '');
  // 1 234,56 или 1234.56
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',') && !raw.includes('.')) {
    raw = raw.replace(',', '.');
  } else {
    raw = raw.replace(/[^\d.-]/g, '');
  }

  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text || null;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return 'Нет данных';
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPartnerLabel(
  number: string,
  name: string | null | undefined,
): string {
  return name ? `${number} — ${name}` : number;
}

export function displayOrEmpty(value: string | null | undefined): string {
  return value && value.trim() ? value : 'Нет данных';
}

export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fallback ниже
  }
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
