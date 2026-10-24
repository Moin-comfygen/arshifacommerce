import { describe, expect, it } from "vitest";
import { analyzeProduct } from "./index";
import { calculateCompetition } from "./competitionScore";
import type { ProductData, Snapshot } from "../types";

function makeProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    marketplace: "flipkart",
    productId: "ITM123",
    url: "https://www.flipkart.com/example/p/itm123",
    title: "Example product",
    brand: null,
    category: null,
    currentPrice: 1200,
    mrp: 1500,
    discount: 20,
    rating: 4.2,
    ratingCount: 1200,
    reviewCount: 95,
    ratingDistribution: { 1: null, 2: null, 3: null, 4: null, 5: null },
    availability: "available",
    seller: null,
    image: null,
    reviews: [],
    competitors: [],
    fields: {},
    capturedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("product analytics", () => {
  it("returns bounded finite scores and no sales when activity data is missing", () => {
    const result = analyzeProduct(makeProduct({
      currentPrice: null, rating: null, ratingCount: null, reviewCount: null, availability: "unavailable",
    }), []);
    for (const score of [result.demand, result.competition, result.opportunity, result.confidence]) {
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    expect(result.estimatedMonthlySales).toBeNull();
    expect(result.estimatedMonthlyRevenue).toBeNull();
    expect(result.recommendation).toBe("AVOID");
  });

  it("returns non-negative estimated sales and revenue ranges for observed activity", () => {
    const result = analyzeProduct(makeProduct({ ratingCount: 125_000, currentPrice: 99_999 }), []);
    expect(result.estimatedMonthlySales?.low).toBeGreaterThanOrEqual(0);
    expect(result.estimatedMonthlySales?.high).toBeGreaterThanOrEqual(result.estimatedMonthlySales?.low ?? 0);
    expect(result.estimatedMonthlyRevenue?.high).toBeGreaterThanOrEqual(result.estimatedMonthlyRevenue?.low ?? 0);
  });

  it("uses local historical growth without producing invalid values", () => {
    const history: Snapshot[] = [
      { id: "1", productId: "ITM123", timestamp: "2026-01-01T00:00:00.000Z", price: 1300, rating: 4.1, ratingCount: 100, reviewCount: 10, availability: "available" },
      { id: "2", productId: "ITM123", timestamp: "2026-02-01T00:00:00.000Z", price: 1200, rating: 4.2, ratingCount: 180, reviewCount: 18, availability: "available" },
    ];
    const result = analyzeProduct(makeProduct({ ratingCount: 180 }), history);
    expect(result.components.historicalVelocity).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(Number.isFinite(result.demand)).toBe(true);
  });

  it("keeps one-competitor and saturated-market scores within bounds", () => {
    const competitor = {
      productId: "COMP-1", title: "Similar example product", url: "https://www.flipkart.com/similar/p/comp1",
      price: 1100, rating: 4.4, ratingCount: 25_000, reviewCount: 2_000, image: null, relevance: 90,
    };
    const one = analyzeProduct(makeProduct({ competitors: [competitor] }), []);
    const many = analyzeProduct(makeProduct({
      competitors: Array.from({ length: 30 }, (_, index) => ({ ...competitor, productId: `COMP-${index}`, ratingCount: 1_000_000 })),
    }), []);
    expect(calculateCompetition([competitor]).score).toBeGreaterThan(0);
    for (const result of [one, many]) {
      for (const score of [result.demand, result.competition, result.opportunity, result.confidence]) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
    expect(many.competition).toBe(100);
  });

  it("shows review sentiment only after a minimum sample and repeated phrases", () => {
    const product = makeProduct({
      reviews: [
        "Good quality and useful for daily work.",
        "Good quality, reliable item.",
        "Poor packaging but the product is useful.",
      ],
    });
    const result = analyzeProduct(product, []);
    expect(result.themes.positive).toContain("Product quality");
    expect(result.customerSentiment.positive).not.toBeNull();
    expect(result.themes.sampleSize).toBe(3);
  });
});
