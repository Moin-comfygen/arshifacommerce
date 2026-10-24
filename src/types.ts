export type DataSource = "json-ld" | "semantic-dom" | "dom" | "text";
export type FieldConfidence = "high" | "medium" | "low";

export interface RatingDistribution {
  1: number | null;
  2: number | null;
  3: number | null;
  4: number | null;
  5: number | null;
}

export interface ExtractedField<T> {
  value: T | null;
  source: DataSource | null;
  confidence: FieldConfidence;
}

export interface ProductData {
  marketplace: "flipkart";
  productId: string | null;
  url: string;
  title: string | null;
  brand: string | null;
  category: string | null;
  currentPrice: number | null;
  mrp: number | null;
  discount: number | null;
  rating: number | null;
  ratingCount: number | null;
  reviewCount: number | null;
  ratingDistribution: RatingDistribution;
  availability: "available" | "unavailable" | "unknown";
  seller: string | null;
  image: string | null;
  reviews: string[];
  competitors: CompetitorData[];
  fields: Record<string, ExtractedField<unknown>>;
  capturedAt: string;
}

export interface CompetitorData {
  productId: string | null;
  title: string;
  url: string;
  price: number | null;
  rating: number | null;
  ratingCount: number | null;
  reviewCount: number | null;
  image: string | null;
  relevance: number;
}

export interface ScoreBreakdown {
  demand: number;
  competition: number;
  opportunity: number;
  confidence: number;
  estimatedMonthlySales: { low: number; high: number } | null;
  estimatedMonthlyRevenue: { low: number; high: number } | null;
  recommendation: "SELL" | "TEST" | "AVOID";
  reasons: string[];
  risks: string[];
  customerSentiment: { positive: number | null; neutral: number | null; negative: number | null };
  themes: { positive: string[]; negative: string[]; sampleSize: number };
  components: Record<string, number | null>;
}

export interface AnalysisRecord {
  id: string;
  product: ProductData;
  scores: ScoreBreakdown;
  createdAt: string;
}

export interface Snapshot {
  id: string;
  productId: string;
  timestamp: string;
  price: number | null;
  rating: number | null;
  ratingCount: number | null;
  reviewCount: number | null;
  availability: ProductData["availability"];
}
