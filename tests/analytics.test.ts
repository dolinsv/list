import { describe, expect, it } from 'vitest';
import { buildPartnerIndex } from '../src/features/partners/buildPartnerIndex';
import { calculateMetrics } from '../src/features/analytics/calculateMetrics';
import { calculateCharts } from '../src/features/analytics/calculateCharts';
import { searchPartners } from '../src/features/partners/searchPartners';
import { createSyntheticPartners } from './fixtures/syntheticPartners';

describe('analytics and search', () => {
  it('prioritizes exact partner number match', () => {
    const hits = searchPartners(createSyntheticPartners(), { query: '200' });
    expect(hits[0]?.exactNumber).toBe(true);
    expect(hits[0]?.partner.partnerNumber).toBe('200');
  });

  it('searches by name case-insensitively', () => {
    const hits = searchPartners(createSyntheticPartners(), { query: 'gamma' });
    expect(hits.some((h) => h.partner.partnerNumber === '300')).toBe(true);
  });

  it('uses company group BB without double-counting children groups', () => {
    const index = buildPartnerIndex(createSyntheticPartners());
    const metrics = calculateMetrics(index, '100', true);
    const groupCard = metrics.cards.find((c) => c.id === 'group_bb');
    expect(groupCard?.value).toBe(500);
    const structureCount = metrics.cards.find((c) => c.id === 'structure_count');
    expect(structureCount?.value).toBe(5);
    const nonzero = metrics.cards.find((c) => c.id === 'nonzero_personal_bb');
    expect(nonzero?.value).toBe(3);
  });

  it('builds charts only from available numeric values', () => {
    const index = buildPartnerIndex(createSyntheticPartners());
    const charts = calculateCharts(index, '100', true);
    expect(charts.levels.length).toBeGreaterThan(0);
    expect(charts.nonzeroRatio.map((p) => p.name).sort()).toEqual(
      ['Ненулевые', 'Нулевые'].sort(),
    );
  });
});
