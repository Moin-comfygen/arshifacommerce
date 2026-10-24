import type { ProductData } from "../types";
import { SCORE_WEIGHTS, clampScore } from "./scoringConstants";

export function calculateConfidence(product: ProductData, competitorCount: number, historyCount: number): number {
  const weights = SCORE_WEIGHTS.confidence;
  const points = [
    product.title ? weights.title : 0,
    product.currentPrice !== null ? weights.price : 0,
    product.rating !== null ? weights.rating : 0,
    product.ratingCount !== null ? weights.ratingCount : 0,
    product.reviewCount !== null ? weights.reviewCount : 0,
    competitorCount >= 5 ? weights.manyCompetitors : competitorCount * weights.competitor,
    historyCount >= 2 ? weights.history : 0,
  ];
  return Math.round(clampScore(points.reduce((total, point) => total + point, 0)));
}
