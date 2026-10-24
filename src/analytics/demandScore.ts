import type { CompetitorData, ProductData, Snapshot } from "../types";
import { SCORE_WEIGHTS, clampScore } from "./scoringConstants";

const activityFromCount = (value: number | null, multiplier: number): number =>
  value === null ? 0 : Math.min(100, Math.log10(value + 1) * multiplier);

export function calculateDemand(product: ProductData, competitors: CompetitorData[], history: Snapshot[]) {
  const first = history[0];
  const latest = history.at(-1);
  const historicalGrowth = history.length > 1 && first.ratingCount !== null && latest !== undefined && latest.ratingCount !== null
    ? clampScore(((latest.ratingCount - first.ratingCount) / Math.max(first.ratingCount, 1)) * 120)
    : null;
  const activity = (activityFromCount(product.ratingCount, SCORE_WEIGHTS.ratingActivityPerLog)
    + activityFromCount(product.reviewCount, SCORE_WEIGHTS.reviewActivityPerLog)) / 2;
  const marketDepth = competitors.length ? clampScore(35 + competitors.length * 4) : null;
  const score = Math.round(clampScore(
    activity * SCORE_WEIGHTS.demandActivity
    + (historicalGrowth ?? 38) * SCORE_WEIGHTS.demandHistory
    + (marketDepth ?? 42) * SCORE_WEIGHTS.demandMarketDepth,
  ));
  return {
    score,
    activity: Math.round(activity),
    historicalGrowth: historicalGrowth === null ? null : Math.round(historicalGrowth),
    marketDepth: marketDepth === null ? null : Math.round(marketDepth),
  };
}
