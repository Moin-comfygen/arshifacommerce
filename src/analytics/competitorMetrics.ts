import type { CompetitorData } from "../types";
import { calculateOpportunity } from "./opportunityScore";
import { estimateMonthlySales } from "./salesEstimator";
import { SCORE_WEIGHTS, clampScore } from "./scoringConstants";

export function calculateCompetitorMetrics(
  product: CompetitorData,
  marketCompetition: number,
  marketAveragePrice: number | null,
) {
  const confidence = Math.round(clampScore(
    (product.title ? SCORE_WEIGHTS.confidence.title : 0)
    + (product.price !== null ? SCORE_WEIGHTS.confidence.price : 0)
    + (product.rating !== null ? SCORE_WEIGHTS.confidence.rating : 0)
    + (product.ratingCount !== null ? SCORE_WEIGHTS.confidence.ratingCount : 0)
    + (product.reviewCount !== null ? SCORE_WEIGHTS.confidence.reviewCount : 0),
  ));
  const activity = (
    (product.ratingCount === null ? 0 : Math.min(100, Math.log10(product.ratingCount + 1) * SCORE_WEIGHTS.ratingActivityPerLog))
    + (product.reviewCount === null ? 0 : Math.min(100, Math.log10(product.reviewCount + 1) * SCORE_WEIGHTS.reviewActivityPerLog))
  ) / 2;
  const demand = Math.round(clampScore(activity));
  const pricePosition = product.price && marketAveragePrice
    ? clampScore(50 + ((marketAveragePrice - product.price) / product.price) * 100)
    : null;
  return {
    demand,
    competition: marketCompetition,
    opportunity: calculateOpportunity(demand, marketCompetition, pricePosition, confidence, 0),
    confidence,
    estimatedMonthlySales: estimateMonthlySales(product, confidence, []),
  };
}
