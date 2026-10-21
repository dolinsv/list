import * as XLSX from 'xlsx';
import type { ParsedReport } from '../../types/report';
import { detectHeaderRow, extractMetaHints } from './detectHeaders';
import { normalizeRows } from './normalizeRows';
import { validateReport } from './validateReport';

const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_FILE_BYTES = 40 * 1024 * 1024;

export function isSupportedExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function sheetToMatrix(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: true,
  });
}

function pickBestSheet(
  workbook: XLSX.WorkBook,
): { name: string; rows: unknown[][] } | null {
  let best: { name: string; rows: unknown[][]; score: number } | null = null;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = sheetToMatrix(sheet);
    const detected = detectHeaderRow(rows);
    const score = detected?.score ?? -1;
    if (!best || score > best.score) {
      best = { name, rows, score };
    }
  }

  if (!best || best.score < 0) return null;
  return { name: best.name, rows: best.rows };
}

export async function parseWorkbookFile(file: File): Promise<ParsedReport> {
  if (!isSupportedExcelFile(file)) {
    throw new Error(
      'Неподдерживаемый формат файла. Загрузите информационный листок в формате .xlsx (допустимо .xls).',
    );
  }
  if (file.size === 0) {
    throw new Error('Файл пуст. Выберите корректный информационный листок.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      'Файл слишком большой для обработки в браузере. Попробуйте уменьшить объём отчёта или использовать другое устройство.',
    );
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new Error(
      'Не удалось прочитать файл через File API. Проверьте доступ к файлу и попробуйте снова.',
    );
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: false,
      raw: true,
    });
  } catch {
    throw new Error(
      'Не удалось разобрать файл. Возможно, он повреждён или имеет неподдерживаемую структуру.',
    );
  }

  // Не удерживаем исходный буфер дольше необходимого
  buffer = null as unknown as ArrayBuffer;

  if (!workbook.SheetNames.length) {
    throw new Error('В книге нет листов с данными.');
  }

  const picked = pickBestSheet(workbook);
  if (!picked) {
    throw new Error(
      'Не удалось определить строку заголовков. Проверьте, что загружен информационный листок Oriflame.',
    );
  }

  const detected = detectHeaderRow(picked.rows);
  if (!detected) {
    throw new Error(
      'Не удалось распознать обязательные колонки в файле.',
    );
  }

  const meta = extractMetaHints(picked.rows);
  const headerRow = picked.rows[detected.rowIndex] ?? [];
  const allHeaders = headerRow.map((cell, index) => {
    if (cell === null || cell === undefined || String(cell).trim() === '') {
      return `col_${index}`;
    }
    return String(cell).replace(/\s+/g, ' ').trim();
  });

  const { partners, unparsedMetricCount } = normalizeRows(
    picked.rows,
    detected.rowIndex,
    detected.mappings,
    allHeaders,
  );

  if (partners.length === 0) {
    throw new Error('После строки заголовков не найдено ни одной записи партнёра.');
  }

  const validation = validateReport({
    fileName: file.name,
    sheetName: picked.name,
    partners,
    mappings: detected.mappings,
    unmappedHeaders: detected.unmappedHeaders,
    unparsedMetricCount,
    suggestedRootNumber: meta.suggestedRootNumber,
    suggestedRootName: meta.suggestedRootName,
  });

  return {
    partners,
    validation,
    catalogLabel: meta.catalogLabel,
    reportDate: meta.reportDate,
  };
}
