import type { ScoreBreakdown } from "../types";

export function recommend(
  hasActivity: boolean,
  confidence: number,
  opportunity: number,
  competition: number,
): ScoreBreakdown["recommendation"] {
  if (!hasActivity || confidence < 30 || opportunity < 35) return "AVOID";
  if (opportunity >= 68 && competition < 60 && confidence >= 60) return "SELL";
  return "TEST";
}
