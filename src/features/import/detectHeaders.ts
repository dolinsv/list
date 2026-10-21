import type { CanonicalField, ColumnMapping } from '../../types/report';
import { matchCanonicalField, normalizeHeader } from './headerDictionary';

export type DetectedHeaderRow = {
  rowIndex: number;
  mappings: ColumnMapping[];
  unmappedHeaders: string[];
  score: number;
};

const REQUIRED_SCORE_FIELDS: CanonicalField[] = [
  'partnerNumber',
  'fullName',
  'sponsorNumber',
];

function scoreMappings(mappings: ColumnMapping[]): number {
  const fields = new Set(mappings.map((m) => m.field));
  let score = mappings.length;
  for (const field of REQUIRED_SCORE_FIELDS) {
    if (fields.has(field)) score += 10;
  }
  if (fields.has('personalBB') || fields.has('groupBB') || fields.has('salesVolume')) {
    score += 5;
  }
  return score;
}

export function detectHeaderRow(rows: unknown[][]): DetectedHeaderRow | null {
  const candidates: DetectedHeaderRow[] = [];
  const scanLimit = Math.min(rows.length, 40);

  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const mappings: ColumnMapping[] = [];
    const unmappedHeaders: string[] = [];
    const usedFields = new Set<CanonicalField>();

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = row[columnIndex];
      if (cell === null || cell === undefined || cell === '') continue;
      const header = String(cell).trim();
      if (!header) continue;

      const field = matchCanonicalField(header);
      if (!field || usedFields.has(field)) {
        if (normalizeHeader(header)) {
          unmappedHeaders.push(header.replace(/\s+/g, ' ').trim());
        }
        continue;
      }

      usedFields.add(field);
      mappings.push({
        field,
        header: header.replace(/\s+/g, ' ').trim(),
        columnIndex,
      });
    }

    if (mappings.length >= 2) {
      candidates.push({
        rowIndex,
        mappings,
        unmappedHeaders,
        score: scoreMappings(mappings),
      });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex);
  return candidates[0] ?? null;
}

export function extractMetaHints(rows: unknown[][]): {
  suggestedRootNumber: string | null;
  suggestedRootName: string | null;
  catalogLabel: string | null;
  reportDate: string | null;
} {
  let suggestedRootNumber: string | null = null;
  let suggestedRootName: string | null = null;
  let catalogLabel: string | null = null;
  let reportDate: string | null = null;

  const scanLimit = Math.min(rows.length, 10);
  for (let i = 0; i < scanLimit; i += 1) {
    const text = (rows[i] ?? [])
      .map((c) => (c == null ? '' : String(c)))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    const partnerMatch = text.match(
      /партн[её]р\s*:\s*(\d+)\s+(.+?)(?:\s*\[|$)/i,
    );
    if (partnerMatch) {
      suggestedRootNumber = partnerMatch[1] ?? null;
      suggestedRootName = (partnerMatch[2] ?? '').trim() || null;
    }

    const catalogMatch = text.match(/каталог\s*:\s*([0-9\s/]+)/i);
    if (catalogMatch) {
      catalogLabel = (catalogMatch[1] ?? '').trim() || null;
    }

    const dateMatch = text.match(/дата\s+отч[её]та\s*:\s*([0-9.:\s]+)/i);
    if (dateMatch) {
      reportDate = (dateMatch[1] ?? '').trim() || null;
    }
  }

  return {
    suggestedRootNumber,
    suggestedRootName,
    catalogLabel,
    reportDate,
  };
}
