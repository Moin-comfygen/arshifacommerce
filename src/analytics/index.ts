import type { AnalysisRecord, ProductData, ScoreBreakdown, Snapshot } from "../types";
import { calculateCompetition } from "./competitionScore";
import { calculateConfidence } from "./confidenceScore";
import { recommend } from "./decisionEngine";
import { calculateDemand } from "./demandScore";
import { calculateOpportunity } from "./opportunityScore";
import { estimateMonthlySales } from "./salesEstimator";
import { clampScore } from "./scoringConstants";

const POSITIVE_THEMES: Record<string, string[]> = {
  "Value for money": ["value for money", "worth the price", "affordable", "budget friendly"],
  "Product quality": ["good quality", "great quality", "excellent quality", "quality is good"],
  "Useful and practical": ["very useful", "works well", "easy to use", "useful product"],
  "Design and appearance": ["good design", "looks good", "attractive", "nice design"],
  "Durability": ["long lasting", "durable", "sturdy", "lasts long"],
};
const NEGATIVE_THEMES: Record<string, string[]> = {
  "Quality concerns": ["poor quality", "bad quality", "cheap material", "weak material"],
  "Packaging or delivery": ["poor packaging", "damaged packaging", "damaged delivery", "arrived damaged"],
  "Size or fit mismatch": ["too small", "too large", "size mismatch", "smaller than expected"],
  "Colour mismatch": ["color mismatch", "colour mismatch", "different color", "different colour"],
  "Performance concerns": ["stopped working", "does not work", "not working", "poor performance"],
};

function classifyReviews(reviews: string[]) {
  if (reviews.length < 3) {
    return {
      sentiment: { positive: null, neutral: null, negative: null },
      themes: { positive: [], negative: [], sampleSize: reviews.length },
      painPoints: 0,
    };
  }
  const counts = { positive: 0, neutral: 0, negative: 0 };
  const positiveThemes = new Map<string, number>();
  const negativeThemes = new Map<string, number>();
  for (const review of reviews) {
    const normalized = review.toLowerCase();
    let positiveMatches = 0;
    let negativeMatches = 0;
    for (const [theme, phrases] of Object.entries(POSITIVE_THEMES)) {
      const matches = phrases.filter((phrase) => normalized.includes(phrase)).length;
      if (matches) {
        positiveThemes.set(theme, (positiveThemes.get(theme) ?? 0) + matches);
        positiveMatches += matches;
      }
    }
    for (const [theme, phrases] of Object.entries(NEGATIVE_THEMES)) {
      const matches = phrases.filter((phrase) => normalized.includes(phrase)).length;
      if (matches) {
        negativeThemes.set(theme, (negativeThemes.get(theme) ?? 0) + matches);
        negativeMatches += matches;
      }
    }
    if (negativeMatches > positiveMatches) counts.negative += 1;
    else if (positiveMatches > negativeMatches) counts.positive += 1;
    else counts.neutral += 1;
  }
  const percentage = (value: number) => Math.round(value * 100 / reviews.length);
  return {
    sentiment: {
      positive: percentage(counts.positive),
      neutral: percentage(counts.neutral),
      negative: percentage(counts.negative),
    },
    themes: {
      positive: [...positiveThemes].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([theme]) => theme),
      negative: [...negativeThemes].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([theme]) => theme),
      sampleSize: reviews.length,
    },
    painPoints: Math.min(20, negativeThemes.size * 4),
  };
}

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function analyzeProduct(product: ProductData, history: Snapshot[]): ScoreBreakdown {
  const competitors = product.competitors.filter((item) => item.relevance >= 25);
  const reviewInsights = classifyReviews(product.reviews);
  const demand = calculateDemand(product, competitors, history);
  const competition = calculateCompetition(competitors);
  const confidence = calculateConfidence(product, competitors.length, history.length);
  const competitorPrices = competitors.map((item) => item.price).filter((value): value is number => value !== null);
  const pricePosition = product.currentPrice && competitorPrices.length
    ? clampScore(50 + ((mean(competitorPrices) - product.currentPrice) / product.currentPrice) * 100)
    : null;
  const opportunity = calculateOpportunity(
    demand.score,
    competition.score,
    pricePosition,
    confidence,
    reviewInsights.painPoints,
  );
  const hasActivity = (product.ratingCount ?? product.reviewCount ?? 0) > 0;
  const recommendation = recommend(hasActivity, confidence, opportunity, competition.score);
  const sales = estimateMonthlySales(product, confidence, history);
  const revenue = sales && product.currentPrice !== null
    ? { low: sales.low * product.currentPrice, high: sales.high * product.currentPrice }
    : null;

  const reasons: string[] = [];
  if (demand.score >= 60) reasons.push("Observed rating and review activity suggests meaningful customer interest.");
  if (competitors.length >= 3) reasons.push(`${competitors.length} relevant listings were visible on the page analyzed.`);
  if (pricePosition !== null && pricePosition > 55) reasons.push("The product is priced below the observed competitor average.");
  if (reviewInsights.themes.negative.length) reasons.push("Repeated review themes suggest specific areas for product differentiation.");
  if (!reasons.length) reasons.push("The available page data is limited; treat the scores as directional.");

  const risks: string[] = [];
  if (history.length < 2) risks.push("No historical snapshots are available to measure momentum.");
  if (!competitors.length) risks.push("No relevant competitor listings were available from the current page.");
  if (confidence < 60) risks.push("Data confidence is limited; sales are an estimate, not verified marketplace data.");
  if (product.currentPrice === null) risks.push("A current price could not be reliably extracted.");

  return {
    demand: demand.score,
    competition: competition.score,
    opportunity,
    confidence,
    estimatedMonthlySales: sales,
    estimatedMonthlyRevenue: revenue,
    recommendation,
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 3),
    customerSentiment: reviewInsights.sentiment,
    themes: reviewInsights.themes,
    components: {
      observedActivity: demand.activity,
      historicalVelocity: demand.historicalGrowth,
      visibleCompetitors: competitors.length,
      competitionStrength: competition.incumbentStrength,
      pricePosition,
      confidence,
    },
  };
}

export function createAnalysis(product: ProductData, history: Snapshot[]): AnalysisRecord {
  const createdAt = new Date().toISOString();
  return {
    id: `${product.productId ?? "unknown"}-${Date.now()}`,
    product,
    scores: analyzeProduct(product, history),
    createdAt,
  };
}
