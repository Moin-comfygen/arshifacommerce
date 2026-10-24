import type { ProductData, Snapshot } from "../types";
import { SCORE_WEIGHTS } from "./scoringConstants";

export interface SalesRange { low: number; high: number }

export function estimateMonthlySales(
  product: Pick<ProductData, "ratingCount" | "reviewCount">,
  confidence: number,
  history: Snapshot[],
): SalesRange | null {
  const activityCount = product.ratingCount ?? product.reviewCount;
  if (activityCount === null) return null;

  const first = history[0];
  const latest = history.at(-1);
  const growthMultiplier = history.length > 1 && first.ratingCount !== null && latest !== undefined && latest.ratingCount !== null
    ? 1 + Math.min(1, Math.max(0, (latest.ratingCount - first.ratingCount) / Math.max(first.ratingCount, 1)))
    : 1;
  const estimate = Math.max(0, Math.round(activityCount * SCORE_WEIGHTS.ratingToMonthlySalesProxy * growthMultiplier));
  const uncertainty = 1 - Math.max(0, Math.min(100, confidence)) / 100;
  return {
    low: Math.max(0, Math.floor(estimate * (1 - uncertainty * 0.65))),
    high: Math.max(0, Math.ceil(estimate * (1 + uncertainty * 0.9))),
  };
}
