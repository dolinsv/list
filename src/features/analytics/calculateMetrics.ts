import type { Partner, PartnerIndex } from '../../types/partner';
import { buildStructureTree, flattenStructure } from '../structure/buildTree';
import { getDirectReports } from '../partners/buildPartnerIndex';

export type MetricScope = 'report' | 'structure';

export type MetricCardData = {
  id: string;
  title: string;
  value: number | null;
  scope: MetricScope;
  source: string;
  note?: string;
};

export type DashboardMetrics = {
  cards: MetricCardData[];
  structurePartnerNumbers: string[];
  root: Partner | null;
};

function uniquePartners(partners: Partner[]): Partner[] {
  const map = new Map<string, Partner>();
  for (const p of partners) {
    if (!p.partnerNumber) continue;
    if (!map.has(p.partnerNumber)) map.set(p.partnerNumber, p);
  }
  return [...map.values()];
}

function countNonZeroPersonalBB(partners: Partner[]): number | null {
  const withValue = partners.filter((p) => p.personalBB !== null);
  if (withValue.length === 0) return null;
  return withValue.filter((p) => (p.personalBB ?? 0) > 0).length;
}

/**
 * Сводные метрики.
 * Групповые ББ корня берутся из отчёта компании и не суммируются
 * повторно по нижестоящим групповым показателям (избегаем двойного учёта).
 */
export function calculateMetrics(
  index: PartnerIndex,
  rootNumber: string,
  hasSponsorField: boolean,
): DashboardMetrics {
  const root = index.byNumber.get(rootNumber) ?? null;
  const reportPartners = uniquePartners(index.all);
  const tree = buildStructureTree(index, rootNumber, hasSponsorField);
  const structurePartners = tree.root
    ? flattenStructure(tree.root).map((n) => n.partner)
    : root
      ? [root]
      : [];
  const structureNumbers = structurePartners.map((p) => p.partnerNumber);
  const directs = getDirectReports(index, rootNumber);

  const cards: MetricCardData[] = [
    {
      id: 'report_count',
      title: 'Партнёров в отчёте',
      value: reportPartners.length,
      scope: 'report',
      source: 'Уникальные номера партнёров во всём загруженном файле',
    },
    {
      id: 'structure_count',
      title: 'Партнёров в структуре',
      value: hasSponsorField ? structurePartners.length : null,
      scope: 'structure',
      source:
        'Уникальные партнёры в дереве от выбранного корня по полю «Спонсор»',
      note: hasSponsorField
        ? undefined
        : 'Нет поля спонсора — структура недоступна',
    },
    {
      id: 'direct_count',
      title: 'Я спонсор',
      value: hasSponsorField ? directs.length : null,
      scope: 'structure',
      source: 'Партнёры, у которых спонсор = выбранный корень',
    },
    {
      id: 'personal_bb',
      title: 'Личные ББ',
      value: root?.personalBB ?? null,
      scope: 'structure',
      source: 'Колонка «ББ Личн» выбранного партнёра (значение из отчёта)',
    },
    {
      id: 'group_bb',
      title: 'ББ персональной группы',
      value: root?.groupBB ?? null,
      scope: 'structure',
      source:
        'Колонка «ББ в ПГ» выбранного партнёра. Не суммируется повторно по нижестоящим.',
    },
    {
      id: 'nonzero_personal_bb',
      title: 'С ненулевыми личными ББ',
      value: countNonZeroPersonalBB(structurePartners),
      scope: 'structure',
      source:
        'Партнёры в структуре с personalBB > 0; отсутствие значения не считается нулём',
    },
  ];

  return {
    cards,
    structurePartnerNumbers: structureNumbers,
    root,
  };
}
