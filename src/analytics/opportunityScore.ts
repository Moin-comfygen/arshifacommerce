import { SCORE_WEIGHTS, clampScore } from "./scoringConstants";

export function calculateOpportunity(
  demand: number,
  competition: number,
  pricePosition: number | null,
  confidence: number,
  painPointOpportunity: number,
): number {
  return Math.round(clampScore(
    demand * SCORE_WEIGHTS.opportunityDemand
    + (100 - competition) * SCORE_WEIGHTS.opportunityLowCompetition
    + (pricePosition ?? 45) * SCORE_WEIGHTS.opportunityPricePosition
    + confidence * SCORE_WEIGHTS.opportunityConfidence
    + painPointOpportunity,
  ));
}
