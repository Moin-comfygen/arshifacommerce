import type { CompetitorData } from "../types";
import { clampScore } from "./scoringConstants";

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function calculateCompetition(competitors: CompetitorData[]): { score: number; incumbentStrength: number } {
  const incumbentStrength = mean(competitors.map((item) =>
    Math.min(100, Math.log10((item.ratingCount ?? 0) + 1) * 26),
  ));
  return {
    score: Math.round(clampScore(competitors.length * 6 + incumbentStrength * 0.45)),
    incumbentStrength: Math.round(incumbentStrength),
  };
}
