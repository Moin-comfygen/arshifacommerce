import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getAnalysis, getHistory, saveAnalysis, trimOldRecords } from "./database";
import type { AnalysisRecord } from "../types";

const record: AnalysisRecord = {
  id: "analysis-1",
  createdAt: new Date().toISOString(),
  product: {
    marketplace: "flipkart", productId: "ITM-TEST", url: "https://www.flipkart.com/test/p/itm-test",
    title: "Test product", brand: null, category: null, currentPrice: 100, mrp: null, discount: null,
    rating: 4, ratingCount: 10, reviewCount: 2, ratingDistribution: { 1: null, 2: null, 3: null, 4: null, 5: null },
    availability: "available", seller: null, image: null, reviews: [], competitors: [], fields: {},
    capturedAt: "2026-10-24T10:00:00.000Z",
  },
  scores: {
    demand: 40, competition: 20, opportunity: 50, confidence: 45,
    estimatedMonthlySales: { low: 1, high: 2 }, estimatedMonthlyRevenue: { low: 100, high: 200 },
    recommendation: "TEST", reasons: [], risks: [], customerSentiment: { positive: null, neutral: null, negative: null },
    themes: { positive: [], negative: [], sampleSize: 0 }, components: {},
  },
};

describe("local IndexedDB persistence", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("product360-local");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });

  it("persists reports and product snapshots locally", async () => {
    await saveAnalysis(record);
    const secondRecord = {
      ...record,
      id: "analysis-2",
      createdAt: new Date(Date.parse(record.createdAt) + 1000).toISOString(),
    };
    await saveAnalysis(secondRecord);
    expect(await getAnalysis(record.id)).toEqual(record);
    expect(await getAnalysis(secondRecord.id)).toEqual(secondRecord);
    const history = await getHistory("ITM-TEST");
    expect(history).toHaveLength(1);
    expect(history[0].price).toBe(100);
    await trimOldRecords(1);
    expect(await getAnalysis(record.id)).toBeNull();
    expect(await getAnalysis(secondRecord.id)).toEqual(secondRecord);
  });
});
