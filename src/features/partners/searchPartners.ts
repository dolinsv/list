import type { Partner } from '../../types/partner';

export type PartnerSearchFilters = {
  query: string;
  minPersonalBB?: number | null;
  maxPersonalBB?: number | null;
  minGroupBB?: number | null;
  maxGroupBB?: number | null;
  hasContacts?: boolean | null;
};

export type PartnerSearchHit = {
  partner: Partner;
  score: number;
  exactNumber: boolean;
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeNumberQuery(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * Поиск по номеру и ФИО без учёта регистра, с приоритетом полного совпадения номера.
 */
export function searchPartners(
  partners: Partner[],
  filters: PartnerSearchFilters,
): PartnerSearchHit[] {
  const query = normalizeText(filters.query);
  const numberQuery = normalizeNumberQuery(filters.query);

  const hits: PartnerSearchHit[] = [];

  for (const partner of partners) {
    if (!partner.partnerNumber) continue;

    if (filters.hasContacts === true) {
      if (!partner.phone && !partner.email) continue;
    } else if (filters.hasContacts === false) {
      if (partner.phone || partner.email) continue;
    }

    if (
      filters.minPersonalBB != null &&
      (partner.personalBB == null || partner.personalBB < filters.minPersonalBB)
    ) {
      continue;
    }
    if (
      filters.maxPersonalBB != null &&
      (partner.personalBB == null || partner.personalBB > filters.maxPersonalBB)
    ) {
      continue;
    }
    if (
      filters.minGroupBB != null &&
      (partner.groupBB == null || partner.groupBB < filters.minGroupBB)
    ) {
      continue;
    }
    if (
      filters.maxGroupBB != null &&
      (partner.groupBB == null || partner.groupBB > filters.maxGroupBB)
    ) {
      continue;
    }

    if (!query) {
      hits.push({ partner, score: 0, exactNumber: false });
      continue;
    }

    let score = -1;
    let exactNumber = false;
    const number = partner.partnerNumber;
    const name = normalizeText(partner.fullName ?? '');

    if (numberQuery) {
      if (number === numberQuery) {
        score = 1000;
        exactNumber = true;
      } else if (number.startsWith(numberQuery)) {
        score = 800 - Math.min(number.length - numberQuery.length, 100);
      } else if (number.includes(numberQuery)) {
        score = 500;
      }
    }

    if (name) {
      if (name === query) score = Math.max(score, 900);
      else if (name.startsWith(query)) score = Math.max(score, 700);
      else if (name.includes(query)) score = Math.max(score, 400);
      else {
        const parts = query.split(' ').filter(Boolean);
        if (parts.length > 1 && parts.every((part) => name.includes(part))) {
          score = Math.max(score, 600);
        }
      }
    }

    if (score >= 0) {
      hits.push({ partner, score, exactNumber });
    }
  }

  hits.sort((a, b) => {
    if (a.exactNumber !== b.exactNumber) return a.exactNumber ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    const nameA = a.partner.fullName ?? '';
    const nameB = b.partner.fullName ?? '';
    return (
      nameA.localeCompare(nameB, 'ru') ||
      a.partner.partnerNumber.localeCompare(b.partner.partnerNumber)
    );
  });

  return hits;
}
