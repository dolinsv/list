import type { CanonicalField } from '../../types/report';

/** Нормализация заголовка: нижний регистр, без переносов/лишних пробелов */
export function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

type AliasRule = {
  field: CanonicalField;
  aliases: string[];
  /** Точное совпадение после нормализации (для коротких заголовков вроде «%») */
  exact?: string[];
};

/**
 * Словарь вариантов названий колонок информационного листка Oriflame.
 * Сопоставление идёт по нормализованной строке, не по номеру колонки.
 */
export const HEADER_RULES: AliasRule[] = [
  {
    field: 'fileLevel',
    aliases: ['ур', 'уровень', 'level'],
    exact: ['ур'],
  },
  {
    field: 'partnerNumber',
    aliases: [
      'партнёр',
      'партнер',
      'номер партнёра',
      'номер партнера',
      'код партнёра',
      'код партнера',
      'partner',
      'partner number',
      'partner no',
    ],
  },
  {
    field: 'fullName',
    aliases: [
      'фамилия имя',
      'фамилия имя отчество',
      'фио',
      'имя',
      'full name',
      'name',
    ],
  },
  {
    field: 'registrationCatalog',
    aliases: [
      'кат. присоед',
      'кат присоед',
      'каталог присоединения',
      'каталог присоед',
      'присоединение',
      'registration catalog',
    ],
  },
  {
    field: 'phone',
    aliases: ['телефон', 'тел', 'phone', 'mobile'],
  },
  {
    field: 'email',
    aliases: [
      'электронная почта',
      'эл. почта',
      'эл почта',
      'почта',
      'email',
      'e-mail',
    ],
  },
  {
    field: 'sponsorNumber',
    aliases: ['спонсор', 'номер спонсора', 'sponsor', 'sponsor number'],
  },
  {
    field: 'inviterNumber',
    aliases: [
      'пригласил',
      'пригласивший',
      'номер пригласившего',
      'inviter',
      'recruiter',
    ],
  },
  {
    field: 'personalBB',
    aliases: [
      'бб личн',
      'бб личные',
      'личные бб',
      'личн бб',
      'personal bb',
      'bp personal',
    ],
  },
  {
    field: 'beautyBB',
    aliases: ['бб бьюти', 'бьюти бб', 'beauty bb'],
  },
  {
    field: 'groupBB',
    aliases: [
      'бб в пг',
      'бб пг',
      'бб персональной группы',
      'групповые бб',
      'group bb',
      'pg bb',
    ],
  },
  {
    field: 'percent',
    aliases: ['процент', 'проц'],
    exact: ['%'],
  },
  {
    field: 'maxPercent',
    aliases: ['макс %', 'макс%', 'максимальный %', 'max %', 'max%'],
  },
  {
    field: 'salesVolume',
    aliases: [
      'оп личн',
      'оп личные',
      'личный объём продаж',
      'личный объем продаж',
      'personal sales',
    ],
  },
  {
    field: 'groupSalesVolume',
    aliases: [
      'оп в пг',
      'оп пг',
      'объём продаж в пг',
      'объем продаж в пг',
      'group sales',
    ],
  },
  {
    field: 'wellnessBB',
    aliases: ['бб, well', 'бб well', 'wellness', 'well.'],
  },
  {
    field: 'novAgeBB',
    aliases: ['бб, novage', 'бб novage', 'novage'],
  },
  {
    field: 'programPlus',
    aliases: ['прогр. плюс', 'прогр плюс', 'программа плюс'],
  },
  {
    field: 'teamBonusPlus',
    aliases: ['команд. бонус+', 'команд бонус+', 'командный бонус+'],
  },
  {
    field: 'teamBonus',
    aliases: ['команд. бонус', 'команд бонус', 'командный бонус'],
  },
  {
    field: 'recommendBonus',
    aliases: ['реком. бонус', 'реком бонус', 'рекомендательный бонус'],
  },
  {
    field: 'extraBonuses',
    aliases: ['доп. бонусы', 'доп бонусы', 'дополнительные бонусы'],
  },
  {
    field: 'overdueDebt',
    aliases: ['проср. долг', 'просроченный долг', 'долг'],
  },
  {
    field: 'inactiveCatalogs',
    aliases: ['нк', 'неактивные каталоги'],
    exact: ['нк'],
  },
  {
    field: 'status',
    aliases: ['статус', 'status'],
  },
];

export function matchCanonicalField(header: string): CanonicalField | null {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;

  for (const rule of HEADER_RULES) {
    if (rule.exact?.some((exact) => normalizeHeader(exact) === normalized)) {
      return rule.field;
    }
  }

  let best: { field: CanonicalField; score: number } | null = null;

  for (const rule of HEADER_RULES) {
    for (const alias of rule.aliases) {
      const a = normalizeHeader(alias);
      if (!a) continue;
      // Избегаем ложных совпадений коротких алиасов
      if (a.length <= 2 && normalized !== a) continue;

      let score = -1;
      if (normalized === a) score = 1000 + a.length;
      else if (normalized.startsWith(a) || normalized.endsWith(a)) score = 500 + a.length;
      else if (normalized.includes(a)) score = 300 + a.length;
      else if (a.includes(normalized) && normalized.length >= 4) score = 100 + normalized.length;

      if (score >= 0 && (!best || score > best.score)) {
        best = { field: rule.field, score };
      }
    }
  }

  return best?.field ?? null;
}
