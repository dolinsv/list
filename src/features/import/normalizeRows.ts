import type { Partner } from '../../types/partner';
import type { CanonicalField, ColumnMapping } from '../../types/report';
import {
  toNullableNumber,
  toNullableString,
  toPartnerId,
} from '../../utils/formatters';

const parsers: Record<CanonicalField, (value: unknown) => unknown> = {
  partnerNumber: toPartnerId,
  fullName: toNullableString,
  registrationCatalog: toNullableString,
  phone: (v) => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return String(Math.trunc(v));
    return toNullableString(v);
  },
  email: toNullableString,
  sponsorNumber: toPartnerId,
  inviterNumber: toPartnerId,
  fileLevel: toNullableNumber,
  personalBB: toNullableNumber,
  beautyBB: toNullableNumber,
  groupBB: toNullableNumber,
  percent: toNullableNumber,
  maxPercent: toNullableNumber,
  salesVolume: toNullableNumber,
  groupSalesVolume: toNullableNumber,
  wellnessBB: toNullableNumber,
  novAgeBB: toNullableNumber,
  programPlus: toNullableNumber,
  teamBonus: toNullableNumber,
  teamBonusPlus: toNullableNumber,
  recommendBonus: toNullableNumber,
  extraBonuses: toNullableNumber,
  overdueDebt: toNullableNumber,
  inactiveCatalogs: toNullableNumber,
  status: toNullableString,
};

function emptyPartner(): Partner {
  return {
    partnerNumber: '',
    fullName: null,
    registrationCatalog: null,
    phone: null,
    email: null,
    sponsorNumber: null,
    inviterNumber: null,
    fileLevel: null,
    personalBB: null,
    beautyBB: null,
    groupBB: null,
    percent: null,
    maxPercent: null,
    salesVolume: null,
    groupSalesVolume: null,
    wellnessBB: null,
    novAgeBB: null,
    programPlus: null,
    teamBonus: null,
    teamBonusPlus: null,
    recommendBonus: null,
    extraBonuses: null,
    overdueDebt: null,
    inactiveCatalogs: null,
    status: null,
    rawFields: {},
  };
}

export type NormalizeResult = {
  partners: Partner[];
  skippedEmpty: number;
  unparsedMetricCount: number;
};

export function normalizeRows(
  rows: unknown[][],
  headerRowIndex: number,
  mappings: ColumnMapping[],
  allHeaders: string[],
): NormalizeResult {
  const partners: Partner[] = [];
  let skippedEmpty = 0;
  let unparsedMetricCount = 0;

  const numericFields = new Set<CanonicalField>([
    'personalBB',
    'beautyBB',
    'groupBB',
    'percent',
    'maxPercent',
    'salesVolume',
    'groupSalesVolume',
    'wellnessBB',
    'novAgeBB',
    'programPlus',
    'teamBonus',
    'teamBonusPlus',
    'recommendBonus',
    'extraBonuses',
    'overdueDebt',
    'inactiveCatalogs',
    'fileLevel',
  ]);

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const isCompletelyEmpty = row.every(
      (cell) => cell === null || cell === undefined || String(cell).trim() === '',
    );
    if (isCompletelyEmpty) {
      skippedEmpty += 1;
      continue;
    }

    const partner = emptyPartner();
    const rawFields: Record<string, unknown> = {};

    for (let col = 0; col < Math.max(row.length, allHeaders.length); col += 1) {
      const header = allHeaders[col] ?? `col_${col}`;
      if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
        rawFields[header] = row[col];
      }
    }

    for (const mapping of mappings) {
      const raw = row[mapping.columnIndex];
      const parsed = parsers[mapping.field](raw);

      if (
        numericFields.has(mapping.field) &&
        raw !== null &&
        raw !== undefined &&
        String(raw).trim() !== '' &&
        parsed === null
      ) {
        unparsedMetricCount += 1;
      }

      (partner as Record<string, unknown>)[mapping.field] = parsed;
    }

    partner.rawFields = rawFields;

    if (!partner.partnerNumber) {
      // Строка без номера — учитывается в валидации как пропуск ключевого поля
      partners.push(partner);
      continue;
    }

    partners.push(partner);
  }

  return { partners, skippedEmpty, unparsedMetricCount };
}
