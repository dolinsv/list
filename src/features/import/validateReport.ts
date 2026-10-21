import type { Partner } from '../../types/partner';
import type {
  ColumnMapping,
  ImportValidation,
  ImportWarning,
} from '../../types/report';

export type ValidateInput = {
  fileName: string;
  sheetName: string | null;
  partners: Partner[];
  mappings: ColumnMapping[];
  unmappedHeaders: string[];
  unparsedMetricCount: number;
  suggestedRootNumber: string | null;
  suggestedRootName: string | null;
};

function findCycles(partners: Partner[]): number {
  const byNumber = new Map(
    partners
      .filter((p) => p.partnerNumber)
      .map((p) => [p.partnerNumber, p.sponsorNumber] as const),
  );
  let cycleCount = 0;
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    const sponsor = byNumber.get(node);
    let found = false;
    if (sponsor && byNumber.has(sponsor)) {
      found = dfs(sponsor);
    }
    visiting.delete(node);
    visited.add(node);
    return found;
  };

  for (const number of byNumber.keys()) {
    if (!visited.has(number) && dfs(number)) {
      cycleCount += 1;
    }
  }
  return cycleCount;
}

/**
 * Стратегия дубликатов: записи не объединяются автоматически.
 * В индекс попадает первая встреча, остальные учитываются в предупреждении
 * и остаются в массиве partners для диагностики.
 */
export function validateReport(input: ValidateInput): ImportValidation {
  const {
    fileName,
    sheetName,
    partners,
    mappings,
    unmappedHeaders,
    unparsedMetricCount,
    suggestedRootNumber,
    suggestedRootName,
  } = input;

  const fields = new Set(mappings.map((m) => m.field));
  const warnings: ImportWarning[] = [];
  const criticalErrors: string[] = [];

  const numbers = partners.map((p) => p.partnerNumber).filter(Boolean);
  const unique = new Set(numbers);
  const duplicateNumbers = numbers.length - unique.size;

  const emptyNumbers = partners.filter((p) => !p.partnerNumber).length;
  const missingNames = partners.filter(
    (p) => p.partnerNumber && !p.fullName,
  ).length;

  const missingKeyFields =
    emptyNumbers +
    partners.filter((p) => p.partnerNumber && !p.sponsorNumber && !p.inviterNumber)
      .length;

  const selfSponsors = partners.filter(
    (p) =>
      p.partnerNumber &&
      p.sponsorNumber &&
      p.partnerNumber === p.sponsorNumber,
  ).length;

  const known = new Set(numbers);
  const missingSponsors = partners.filter(
    (p) => p.sponsorNumber && !known.has(p.sponsorNumber),
  ).length;

  const cycles = findCycles(partners.filter((p) => p.partnerNumber));

  const required = {
    partnerNumber: fields.has('partnerNumber'),
    identity: fields.has('fullName'),
    sponsorLink: fields.has('sponsorNumber'),
    analyticsMetric:
      fields.has('personalBB') ||
      fields.has('groupBB') ||
      fields.has('salesVolume') ||
      fields.has('groupSalesVolume') ||
      fields.has('percent'),
  };

  if (!required.partnerNumber) {
    criticalErrors.push(
      'Не удалось определить колонку с номером партнёра. Анализ недоступен.',
    );
  }
  if (!required.identity) {
    criticalErrors.push(
      'Не удалось определить колонку с ФИО или другим полем идентификации.',
    );
  }
  if (!required.sponsorLink) {
    criticalErrors.push(
      'Не удалось определить колонку спонсора. Список партнёров будет доступен, но дерево структуры строить нельзя.',
    );
  }
  if (!required.analyticsMetric) {
    warnings.push({
      code: 'missing_analytics_metric',
      message:
        'Не распознан ни один числовой показатель для аналитики. Карточки и поиск будут доступны без сводных графиков.',
    });
  }

  // Критическая ошибка спонсора не блокирует список — только дерево.
  // Переносим отсутствие спонсора из critical в предупреждение, если остальные поля есть.
  const sponsorCriticalIndex = criticalErrors.findIndex((e) =>
    e.includes('спонсора'),
  );
  if (
    sponsorCriticalIndex >= 0 &&
    required.partnerNumber &&
    required.identity
  ) {
    const [msg] = criticalErrors.splice(sponsorCriticalIndex, 1);
    if (msg) {
      warnings.push({
        code: 'missing_optional_fields',
        message: msg,
      });
    }
  }

  if (duplicateNumbers > 0) {
    warnings.push({
      code: 'duplicate_numbers',
      message:
        'Обнаружены повторяющиеся номера партнёров. Записи не объединяются автоматически; в поиске приоритет у первой встреченной записи.',
      count: duplicateNumbers,
    });
  }
  if (emptyNumbers > 0) {
    warnings.push({
      code: 'empty_numbers',
      message: 'Есть строки без номера партнёра.',
      count: emptyNumbers,
    });
  }
  if (missingNames > 0) {
    warnings.push({
      code: 'missing_name',
      message: 'Есть партнёры без ФИО.',
      count: missingNames,
    });
  }
  if (missingSponsors > 0) {
    warnings.push({
      code: 'missing_sponsors',
      message:
        'Есть ссылки на спонсоров, которых нет в загруженном отчёте. Такие ветки обрываются.',
      count: missingSponsors,
    });
  }
  if (selfSponsors > 0) {
    warnings.push({
      code: 'self_sponsor',
      message: 'Обнаружены ссылки спонсора на самого себя.',
      count: selfSponsors,
    });
  }
  if (cycles > 0) {
    warnings.push({
      code: 'cycles',
      message:
        'Обнаружены циклические спонсорские связи. При построении дерева повторный обход узлов исключается.',
      count: cycles,
    });
  }
  if (unparsedMetricCount > 0) {
    warnings.push({
      code: 'unparsed_metrics',
      message:
        'Часть показателей не удалось преобразовать в число. Они отображаются как «Нет данных».',
      count: unparsedMetricCount,
    });
  }
  if (unmappedHeaders.length > 0) {
    warnings.push({
      code: 'unknown_columns',
      message: `Некоторые колонки не сопоставлены с известными полями и сохранены в исходных данных: ${unmappedHeaders.slice(0, 8).join(', ')}${unmappedHeaders.length > 8 ? '…' : ''}.`,
      count: unmappedHeaders.length,
    });
  }

  const ok =
    criticalErrors.length === 0 &&
    required.partnerNumber &&
    required.identity &&
    unique.size > 0;

  // Предложение корня: мета → первая корректная строка с номером и ФИО
  let suggestedNumber = suggestedRootNumber;
  let suggestedName = suggestedRootName;
  if (suggestedNumber && !unique.has(suggestedNumber)) {
    suggestedNumber = null;
    suggestedName = null;
  }
  if (!suggestedNumber) {
    const first = partners.find((p) => p.partnerNumber && p.fullName);
    if (first) {
      suggestedNumber = first.partnerNumber;
      suggestedName = first.fullName;
    }
  } else if (!suggestedName) {
    suggestedName =
      partners.find((p) => p.partnerNumber === suggestedNumber)?.fullName ??
      null;
  }

  return {
    ok,
    criticalErrors,
    warnings,
    fileName,
    sheetName,
    rowCount: partners.length,
    partnerCount: partners.filter((p) => p.partnerNumber).length,
    uniqueNumbers: unique.size,
    missingKeyFields,
    duplicateNumbers,
    mappedColumns: mappings,
    unmappedHeaders,
    required,
    suggestedRootNumber: suggestedNumber,
    suggestedRootName: suggestedName,
  };
}
