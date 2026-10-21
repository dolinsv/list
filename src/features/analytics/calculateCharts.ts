import type { PartnerIndex } from '../../types/partner';
import { calculateLevelsRelativeToRoot } from '../structure/calculateLevels';
import { buildStructureTree, flattenStructure } from '../structure/buildTree';
import { getDirectReports } from '../partners/buildPartnerIndex';

export type ChartPoint = {
  name: string;
  value: number;
  secondary?: number;
};

export type ChartsData = {
  levels: ChartPoint[];
  directBranches: ChartPoint[];
  personalBBDistribution: ChartPoint[];
  topPersonalBB: ChartPoint[];
  nonzeroRatio: ChartPoint[];
  branchMetricLabel: string;
};

function bucketPersonalBB(value: number): string {
  if (value <= 0) return '0';
  if (value < 50) return '1–49';
  if (value < 100) return '50–99';
  if (value < 200) return '100–199';
  if (value < 500) return '200–499';
  return '500+';
}

function shortLabel(fullName: string | null, partnerNumber: string): string {
  if (!fullName) return partnerNumber;
  const first = fullName.split(' ')[0] ?? fullName;
  return `${first} (${partnerNumber})`;
}

export function calculateCharts(
  index: PartnerIndex,
  rootNumber: string,
  hasSponsorField: boolean,
): ChartsData {
  const levels = calculateLevelsRelativeToRoot(
    index,
    rootNumber,
    hasSponsorField,
  ).map((item) => ({
    name: item.level === 0 ? 'Корень' : `Уровень ${item.level}`,
    value: item.count,
  }));

  const directs = getDirectReports(index, rootNumber);
  const hasAnyGroup = directs.some((p) => p.groupBB !== null);
  const branchMetricLabel = hasAnyGroup ? 'ББ в ПГ ветки' : 'Личные ББ ветки';

  const cleanedBranches: ChartPoint[] = [];
  for (const partner of directs) {
    const value = hasAnyGroup ? partner.groupBB : partner.personalBB;
    if (value === null) continue;
    cleanedBranches.push({
      name: shortLabel(partner.fullName, partner.partnerNumber),
      value,
      secondary: partner.personalBB ?? undefined,
    });
  }
  cleanedBranches.sort((a, b) => b.value - a.value);
  const topBranches = cleanedBranches.slice(0, 12);

  const tree = buildStructureTree(index, rootNumber, hasSponsorField);
  const structurePartners = tree.root
    ? flattenStructure(tree.root).map((n) => n.partner)
    : [];

  const order = ['0', '1–49', '50–99', '100–199', '200–499', '500+'];
  const bucketCounts = new Map<string, number>(order.map((k) => [k, 0]));

  let withPersonal = 0;
  let nonzero = 0;
  let zero = 0;

  for (const partner of structurePartners) {
    if (partner.personalBB === null) continue;
    withPersonal += 1;
    const bucket = bucketPersonalBB(partner.personalBB);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
    if (partner.personalBB > 0) nonzero += 1;
    else zero += 1;
  }

  const personalBBDistribution = order.map((name) => ({
    name,
    value: bucketCounts.get(name) ?? 0,
  }));

  const topPersonalBB = structurePartners
    .filter((p) => p.personalBB !== null)
    .sort((a, b) => (b.personalBB ?? 0) - (a.personalBB ?? 0))
    .slice(0, 10)
    .map((p) => ({
      name: shortLabel(p.fullName, p.partnerNumber),
      value: p.personalBB as number,
    }));

  const nonzeroRatio =
    withPersonal > 0
      ? [
          { name: 'Ненулевые', value: nonzero },
          { name: 'Нулевые', value: zero },
        ]
      : [];

  return {
    levels: hasSponsorField ? levels : [],
    directBranches: hasSponsorField ? topBranches : [],
    personalBBDistribution: withPersonal > 0 ? personalBBDistribution : [],
    topPersonalBB,
    nonzeroRatio,
    branchMetricLabel,
  };
}
