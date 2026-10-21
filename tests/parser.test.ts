import { describe, expect, it } from 'vitest';
import { detectHeaderRow, extractMetaHints } from '../src/features/import/detectHeaders';
import { normalizeRows } from '../src/features/import/normalizeRows';
import { validateReport } from '../src/features/import/validateReport';
import { SYNTHETIC_HEADER_ROWS } from './fixtures/syntheticPartners';

describe('import parser', () => {
  it('detects headers independently of column order noise', () => {
    const detected = detectHeaderRow(SYNTHETIC_HEADER_ROWS);
    expect(detected).not.toBeNull();
    expect(detected?.rowIndex).toBe(4);
    const fields = new Set(detected?.mappings.map((m) => m.field));
    expect(fields.has('partnerNumber')).toBe(true);
    expect(fields.has('fullName')).toBe(true);
    expect(fields.has('sponsorNumber')).toBe(true);
    expect(fields.has('personalBB')).toBe(true);
  });

  it('extracts suggested root from meta without trusting first row blindly', () => {
    const meta = extractMetaHints(SYNTHETIC_HEADER_ROWS);
    expect(meta.suggestedRootNumber).toBe('100');
    expect(meta.suggestedRootName).toBe('Root Partner');
    expect(meta.catalogLabel).toContain('1 / 2099');
  });

  it('keeps partner ids as strings and nulls instead of zeros', () => {
    const detected = detectHeaderRow(SYNTHETIC_HEADER_ROWS)!;
    const headers = (SYNTHETIC_HEADER_ROWS[4] ?? []).map((c) =>
      String(c).replace(/\s+/g, ' ').trim(),
    );
    const { partners } = normalizeRows(
      SYNTHETIC_HEADER_ROWS,
      detected.rowIndex,
      detected.mappings,
      headers,
    );
    const delta = partners.find((p) => p.partnerNumber === '301');
    expect(delta?.personalBB).toBeNull();
    expect(delta?.groupBB).toBeNull();
    expect(typeof partners[0]?.partnerNumber).toBe('string');
  });

  it('reports validation summary and does not merge duplicates silently', () => {
    const detected = detectHeaderRow(SYNTHETIC_HEADER_ROWS)!;
    const headers = (SYNTHETIC_HEADER_ROWS[4] ?? []).map((c) =>
      String(c).replace(/\s+/g, ' ').trim(),
    );
    const { partners, unparsedMetricCount } = normalizeRows(
      SYNTHETIC_HEADER_ROWS,
      detected.rowIndex,
      detected.mappings,
      headers,
    );
    const validation = validateReport({
      fileName: 'synthetic.xlsx',
      sheetName: 'ActivityReport',
      partners,
      mappings: detected.mappings,
      unmappedHeaders: detected.unmappedHeaders,
      unparsedMetricCount,
      suggestedRootNumber: '100',
      suggestedRootName: 'Root Partner',
    });
    expect(validation.ok).toBe(true);
    expect(validation.uniqueNumbers).toBe(5);
    expect(validation.suggestedRootNumber).toBe('100');
  });
});
