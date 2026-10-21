export type Partner = {
  partnerNumber: string;
  fullName: string | null;

  registrationCatalog: string | null;

  phone: string | null;
  email: string | null;

  sponsorNumber: string | null;
  inviterNumber: string | null;

  /** Уровень из исходного файла (колонка «Ур»), не иерархия относительно корня */
  fileLevel: number | null;

  personalBB: number | null;
  beautyBB: number | null;
  groupBB: number | null;

  percent: number | null;
  maxPercent: number | null;

  salesVolume: number | null;
  groupSalesVolume: number | null;

  wellnessBB: number | null;
  novAgeBB: number | null;

  programPlus: number | null;
  teamBonus: number | null;
  teamBonusPlus: number | null;
  recommendBonus: number | null;
  extraBonuses: number | null;

  overdueDebt: number | null;
  inactiveCatalogs: number | null;
  status: string | null;

  /** Исходные значения по распознанным/нераспознанным колонкам */
  rawFields: Record<string, unknown>;
};

export type PartnerIndex = {
  byNumber: Map<string, Partner>;
  childrenBySponsor: Map<string, string[]>;
  all: Partner[];
};
