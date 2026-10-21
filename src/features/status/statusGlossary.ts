export type StatusCodeInfo = {
  code: string;
  title: string;
  description: string;
};

/**
 * Расшифровка меток из информационного листка Oriflame.
 * Более длинные коды идут первыми, чтобы (S*) не принимался за (S).
 */
export const STATUS_GLOSSARY: StatusCodeInfo[] = [
  {
    code: 'S*',
    title: 'Спящий Стартер',
    description: 'Партнёр, который не сделал ни одного заказа с ББ.',
  },
  {
    code: 'SR',
    title: 'Спящий Рекрут',
    description:
      'Партнёр, у которого нет заказов с ББ, но ранее был статус рекрута.',
  },
  {
    code: 'НП*',
    title: 'Программа Плюс',
    description: 'Участник бонуса наставника «Программа Плюс».',
  },
  {
    code: 'НП+',
    title: 'Программа Плюс',
    description: 'Участник бонуса наставника «Программа Плюс».',
  },
  {
    code: 'НС*',
    title: 'Бонус пригласившего спонсора',
    description: 'Участник бонуса наставника для пригласивших спонсоров.',
  },
  {
    code: 'НС+',
    title: 'Бонус пригласившего спонсора',
    description: 'Участник бонуса наставника для пригласивших спонсоров.',
  },
  {
    code: 'RA',
    title: 'Реактивированный',
    description: 'Партнёр снова стал активным после периода без заказов.',
  },
  {
    code: 'НК',
    title: 'Неактивные каталоги',
    description:
      'Число последних каталогов (включая текущий), в которых не было заказов с ББ > 0.',
  },
  {
    code: '+',
    title: 'Бьюти Партнёр',
    description: 'Статус «Бьюти Партнёр».',
  },
  {
    code: 'S',
    title: 'Стартер',
    description: 'Партнёр, присоединившийся в текущем каталоге.',
  },
  {
    code: 'R',
    title: 'Рекрут',
    description: 'Партнёр, сделавший первый заказ с ББ.',
  },
  {
    code: 'Q',
    title: 'Партнёр',
    description:
      'Квалифицированный рекрут: набрал 30 ББ в каталоге присоединения или следующем.',
  },
  {
    code: '*',
    title: 'Терминированный',
    description: 'Статус терминированного партнёра.',
  },
];

export type DecodedStatus = {
  raw: string;
  matches: StatusCodeInfo[];
  unknownParts: string[];
};

function normalizeCode(code: string): string {
  return code.replace(/[()]/g, '').trim().toUpperCase();
}

/** Извлекает известные коды из строки статуса отчёта */
export function decodePartnerStatus(raw: string | null | undefined): DecodedStatus | null {
  if (!raw || !raw.trim()) return null;
  const text = raw.replace(/\s+/g, ' ').trim();
  const upper = text.toUpperCase();
  const matched: StatusCodeInfo[] = [];
  const usedRanges: Array<{ start: number; end: number }> = [];

  for (const entry of STATUS_GLOSSARY) {
    const needle = entry.code.toUpperCase();
    // Ищем код как отдельный токен: (+), +, S*, (S*) и т.п.
    const patterns = [
      new RegExp(`\\(\\s*${escapeRegExp(needle)}\\s*\\)`, 'gi'),
      new RegExp(`(?<![A-ZА-Я0-9*+])${escapeRegExp(needle)}(?![A-ZА-Я0-9*+])`, 'gi'),
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(upper)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const overlaps = usedRanges.some(
          (r) => start < r.end && end > r.start,
        );
        if (overlaps) continue;
        usedRanges.push({ start, end });
        if (!matched.some((m) => m.code === entry.code)) {
          matched.push(entry);
        }
      }
    }
  }

  const covered = usedRanges
    .slice()
    .sort((a, b) => a.start - b.start)
    .reduce((acc, range) => {
      for (let i = range.start; i < range.end; i += 1) acc.add(i);
      return acc;
    }, new Set<number>());

  const leftoverChars = [...upper]
    .map((ch, i) => (covered.has(i) ? ' ' : ch))
    .join('')
    .replace(/[()\s,;|/·•]+/g, ' ')
    .trim();

  const unknownParts = leftoverChars
    ? leftoverChars.split(/\s+/).filter(Boolean).map(normalizeCode)
    : [];

  return {
    raw: text,
    matches: matched,
    unknownParts: unknownParts.filter(
      (p) => p && !STATUS_GLOSSARY.some((g) => g.code.toUpperCase() === p),
    ),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const FIELD_HINTS: Record<string, string> = {
  'ББ Бьюти': 'Баллы бонуса по категории Beauty.',
  'ББ в ПГ': 'Баллы персональной группы (ПГ).',
  'Прогр. Плюс': 'Бонус по «Программе Плюс», рассчитывается в конце каталога.',
  'Команд. Бонус': 'Командный бонус, рассчитывается в конце каталога.',
  'Команд. Бонус+': 'Юбилейный командный бонус.',
  'Реком. Бонус': 'Рекомендательный бонус (для Бизнес-партнёров).',
  'Доп. Бонусы': 'Дополнительные бонусы по различным программам.',
  НК: 'Неактивные каталоги: число каталогов без заказов с ББ > 0.',
  'ББ, Well.': 'Баллы по продукции Wellosophy.',
  'ББ, NovAge': 'Баллы по продукции NovAge.',
};
