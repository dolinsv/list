import { describe, expect, it } from 'vitest';
import { buildPartnerIndex } from '../src/features/partners/buildPartnerIndex';
import { buildStructureTree } from '../src/features/structure/buildTree';
import { calculateLevelsRelativeToRoot } from '../src/features/structure/calculateLevels';
import { createSyntheticPartners } from './fixtures/syntheticPartners';
import type { Partner } from '../src/types/partner';

describe('structure', () => {
  it('builds tree from sponsor links relative to selected root', () => {
    const index = buildPartnerIndex(createSyntheticPartners());
    const tree = buildStructureTree(index, '100', true);
    expect(tree.canBuild).toBe(true);
    expect(tree.nodeCount).toBe(5);
    expect(tree.root?.children).toHaveLength(2);
    const levels = calculateLevelsRelativeToRoot(index, '100', true);
    expect(levels.find((l) => l.level === 0)?.count).toBe(1);
    expect(levels.find((l) => l.level === 1)?.count).toBe(2);
    expect(levels.find((l) => l.level === 2)?.count).toBe(2);
  });

  it('does not hang on cyclic sponsor links', () => {
    const partners: Partner[] = createSyntheticPartners().map((p) => ({ ...p }));
    const a = partners.find((p) => p.partnerNumber === '300');
    const b = partners.find((p) => p.partnerNumber === '200');
    if (a && b) {
      a.sponsorNumber = '200';
      b.sponsorNumber = '300';
    }
    const index = buildPartnerIndex(partners);
    const tree = buildStructureTree(index, '100', true);
    expect(tree.nodeCount).toBeGreaterThan(0);
    expect(tree.truncatedCycles).toBeGreaterThanOrEqual(0);
  });

  it('refuses fictional tree without sponsor field', () => {
    const index = buildPartnerIndex(createSyntheticPartners());
    const tree = buildStructureTree(index, '100', false);
    expect(tree.canBuild).toBe(false);
    expect(tree.root).toBeNull();
  });
});
