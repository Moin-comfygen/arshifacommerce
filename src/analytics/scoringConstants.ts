export const SCORE_WEIGHTS = {
  demandActivity: 0.55,
  demandHistory: 0.2,
  demandMarketDepth: 0.25,
  opportunityDemand: 0.4,
  opportunityLowCompetition: 0.35,
  opportunityPricePosition: 0.15,
  opportunityConfidence: 0.1,
  ratingActivityPerLog: 22,
  reviewActivityPerLog: 24,
  ratingToMonthlySalesProxy: 0.035,
  confidence: {
    title: 12,
    price: 15,
    rating: 12,
    ratingCount: 16,
    reviewCount: 10,
    competitor: 4,
    manyCompetitors: 20,
    history: 15,
  },
} as const;

export const clampScore = (value: number): number => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
