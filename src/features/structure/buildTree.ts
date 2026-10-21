import type { Partner, PartnerIndex } from '../../types/partner';

export type StructureNode = {
  partnerNumber: string;
  partner: Partner;
  level: number;
  children: StructureNode[];
};

export type StructureBuildResult = {
  root: StructureNode | null;
  nodeCount: number;
  maxLevel: number;
  truncatedCycles: number;
  missingChildrenSkipped: number;
  canBuild: boolean;
  message: string | null;
};

/**
 * Дерево строится только по полю спонсора.
 * Пригласивший хранится отдельно и не используется как эквивалент спонсора.
 */
export function buildStructureTree(
  index: PartnerIndex,
  rootNumber: string,
  hasSponsorField: boolean,
): StructureBuildResult {
  if (!hasSponsorField) {
    return {
      root: null,
      nodeCount: 0,
      maxLevel: 0,
      truncatedCycles: 0,
      missingChildrenSkipped: 0,
      canBuild: false,
      message:
        'В отчёте нет достоверного поля спонсора — дерево структуры недоступно.',
    };
  }

  const rootPartner = index.byNumber.get(rootNumber);
  if (!rootPartner) {
    return {
      root: null,
      nodeCount: 0,
      maxLevel: 0,
      truncatedCycles: 0,
      missingChildrenSkipped: 0,
      canBuild: false,
      message: 'Выбранный партнёр не найден в загруженном отчёте.',
    };
  }

  let truncatedCycles = 0;
  let missingChildrenSkipped = 0;
  let nodeCount = 0;
  let maxLevel = 0;

  const walk = (number: string, level: number, path: Set<string>): StructureNode | null => {
    if (path.has(number)) {
      truncatedCycles += 1;
      return null;
    }
    const partner = index.byNumber.get(number);
    if (!partner) {
      missingChildrenSkipped += 1;
      return null;
    }

    const nextPath = new Set(path);
    nextPath.add(number);
    nodeCount += 1;
    maxLevel = Math.max(maxLevel, level);

    const childIds = index.childrenBySponsor.get(number) ?? [];
    const children: StructureNode[] = [];
    for (const childId of childIds) {
      const child = walk(childId, level + 1, nextPath);
      if (child) children.push(child);
    }

    return {
      partnerNumber: number,
      partner,
      level,
      children,
    };
  };

  const root = walk(rootNumber, 0, new Set());
  return {
    root,
    nodeCount,
    maxLevel,
    truncatedCycles,
    missingChildrenSkipped,
    canBuild: Boolean(root),
    message: root
      ? null
      : 'Не удалось построить структуру для выбранного партнёра.',
  };
}

export function flattenStructure(
  node: StructureNode | null,
): StructureNode[] {
  if (!node) return [];
  const result: StructureNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenStructure(child));
  }
  return result;
}

export function findInStructure(
  node: StructureNode | null,
  query: string,
): StructureNode[] {
  const q = query.trim().toLowerCase();
  if (!q || !node) return [];
  return flattenStructure(node).filter((n) => {
    const number = n.partnerNumber.toLowerCase();
    const name = (n.partner.fullName ?? '').toLowerCase();
    return number.includes(q) || name.includes(q);
  });
}
