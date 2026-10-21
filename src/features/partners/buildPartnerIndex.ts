import type { Partner, PartnerIndex } from '../../types/partner';

/**
 * Индекс по уникальным номерам.
 * При дубликатах сохраняется первая запись; остальные остаются в all.
 */
export function buildPartnerIndex(partners: Partner[]): PartnerIndex {
  const byNumber = new Map<string, Partner>();
  const childrenBySponsor = new Map<string, string[]>();

  for (const partner of partners) {
    if (!partner.partnerNumber) continue;
    if (!byNumber.has(partner.partnerNumber)) {
      byNumber.set(partner.partnerNumber, partner);
    }
  }

  for (const partner of byNumber.values()) {
    if (!partner.sponsorNumber) continue;
    if (partner.sponsorNumber === partner.partnerNumber) continue;
    const list = childrenBySponsor.get(partner.sponsorNumber) ?? [];
    list.push(partner.partnerNumber);
    childrenBySponsor.set(partner.sponsorNumber, list);
  }

  for (const [, list] of childrenBySponsor) {
    list.sort((a, b) => {
      const pa = byNumber.get(a);
      const pb = byNumber.get(b);
      const nameA = pa?.fullName ?? '';
      const nameB = pb?.fullName ?? '';
      return nameA.localeCompare(nameB, 'ru') || a.localeCompare(b);
    });
  }

  return {
    byNumber,
    childrenBySponsor,
    all: partners,
  };
}

export function getDirectReports(
  index: PartnerIndex,
  partnerNumber: string,
): Partner[] {
  const ids = index.childrenBySponsor.get(partnerNumber) ?? [];
  return ids
    .map((id) => index.byNumber.get(id))
    .filter((p): p is Partner => Boolean(p));
}
