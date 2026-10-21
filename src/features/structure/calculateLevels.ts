import type { PartnerIndex } from '../../types/partner';
import { buildStructureTree, flattenStructure } from './buildTree';

export type LevelStat = {
  level: number;
  count: number;
};

/**
 * Уровни считаются относительно выбранного корня по спонсорским связям,
 * а не по колонке «Ур» и не по порядку строк Excel.
 */
export function calculateLevelsRelativeToRoot(
  index: PartnerIndex,
  rootNumber: string,
  hasSponsorField: boolean,
): LevelStat[] {
  const tree = buildStructureTree(index, rootNumber, hasSponsorField);
  if (!tree.root) return [];

  const counts = new Map<number, number>();
  for (const node of flattenStructure(tree.root)) {
    counts.set(node.level, (counts.get(node.level) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, count]) => ({ level, count }));
}
