import type {
  CompetitorData,
  DataSource,
  ExtractedField,
  ProductData,
  RatingDistribution,
} from "../../types";

const emptyDistribution = (): RatingDistribution => ({ 1: null, 2: null, 3: null, 4: null, 5: null });
const currencyPattern = /(?:₹|Rs\.?\s*)\s*([\d,]+(?:\.\d+)?)/i;
const countPattern = /([\d,.]+)\s*([KLM])?\s*(?:ratings?|reviews?)/i;

export function parseIndianNumber(input: string | null | undefined): number | null {
  if (!input) return null;
  const normalized = input.trim().replace(/[₹,\s]/g, "").replace(/^Rs\.?/i, "");
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([KLM])?$/i);
  if (!match) return null;
  const multiplier = ({ K: 1_000, L: 100_000, M: 1_000_000 } as Record<string, number>)[
    (match[2] ?? "").toUpperCase()
  ] ?? 1;
  const value = Number(match[1]) * multiplier;
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

export function parsePrice(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.match(currencyPattern) ?? input.match(/([\d,]+(?:\.\d+)?)/);
  return match ? parseIndianNumber(match[1]) : null;
}

export function parseCount(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.match(countPattern);
  return match ? parseIndianNumber(`${match[1]}${match[2] ?? ""}`) : null;
}

export function extractProductId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.match(/\/p\/([a-z0-9]+)/i);
    return path?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

export function isFlipkartUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" && (parsed.hostname === "www.flipkart.com" || parsed.hostname === "flipkart.com");
  } catch {
    return false;
  }
}

function field<T>(value: T | null, source: DataSource | null, confidence: ExtractedField<T>["confidence"]): ExtractedField<T> {
  return { value, source, confidence };
}

function textOf(element: Element | null | undefined): string | null {
  const value = element?.textContent?.replace(/\s+/g, " ").trim();
  return value || null;
}

function visibleText(): string {
  return document.body.innerText ?? document.body.textContent ?? "";
}

function jsonLdProducts(): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    try {
      const data: unknown = JSON.parse(script.textContent ?? "");
      const visit = (value: unknown): void => {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === "object") {
          const item = value as Record<string, unknown>;
          if (item["@type"] === "Product" || (Array.isArray(item["@type"]) && item["@type"].includes("Product"))) results.push(item);
          if (item["@graph"]) visit(item["@graph"]);
        }
      };
      visit(data);
    } catch {
      // Malformed page metadata is ignored; DOM extraction remains available.
    }
  });
  return results;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function productFromJsonLd(product: Record<string, unknown>): Partial<ProductData> {
  const offers = asObject(product.offers);
  const aggregate = asObject(product.aggregateRating);
  const brand = asObject(product.brand);
  const price = offers?.price ?? offers?.lowPrice;
  const rating = aggregate?.ratingValue;
  return {
    title: typeof product.name === "string" ? product.name.trim() : null,
    brand: typeof brand?.name === "string" ? brand.name : typeof product.brand === "string" ? product.brand : null,
    image: typeof product.image === "string" ? product.image : Array.isArray(product.image) && typeof product.image[0] === "string" ? product.image[0] : null,
    currentPrice: price !== undefined ? parseIndianNumber(String(price)) : null,
    mrp: null,
    rating: rating !== undefined ? Number(rating) || null : null,
    ratingCount: aggregate?.ratingCount !== undefined ? parseIndianNumber(String(aggregate.ratingCount)) : null,
    reviewCount: aggregate?.reviewCount !== undefined ? parseIndianNumber(String(aggregate.reviewCount)) : null,
    availability: typeof offers?.availability === "string" && /outofstock/i.test(offers.availability) ? "unavailable" : "unknown",
  };
}

function firstText(selectors: string[]): { value: string | null; selector: string | null } {
  for (const selector of selectors) {
    const value = textOf(document.querySelector(selector));
    if (value) return { value, selector };
  }
  return { value: null, selector: null };
}

function findPrice(text: string | null): number | null {
  return text ? parsePrice(text) : null;
}

function findCountNearRating(kind: "ratings" | "reviews"): number | null {
  const pattern = kind === "ratings" ? /([\d,.]+\s*[KLM]?)\s*ratings?/i : /([\d,.]+\s*[KLM]?)\s*reviews?/i;
  let element = document.querySelector("div.XQDdHH, div._3LWZlK, [aria-label*='out of 5']");
  for (let depth = 0; element && depth < 4; depth += 1, element = element.parentElement) {
    const match = element.textContent?.match(pattern)?.[0];
    if (match) return parseCount(match);
  }
  return parseCount(visibleText().match(pattern)?.[0] ?? null);
}

const findRatingCount = (): number | null => findCountNearRating("ratings");
const findReviewCount = (): number | null => findCountNearRating("reviews");

function extractReviews(): string[] {
  const candidates = [
    '[data-tkid] [class*="review"]',
    '[class*="review"] [class*="comment"]',
    '[class*="review"] [class*="text"]',
    'div[role="listitem"]',
  ];
  const found = new Set<string>();
  for (const selector of candidates) {
    document.querySelectorAll(selector).forEach((element) => {
      const text = textOf(element);
      if (text && text.length >= 30 && text.length <= 1200 && !/read more|helpful/i.test(text)) found.add(text);
    });
    if (found.size >= 30) break;
  }
  return [...found].slice(0, 50);
}

function tokenize(text: string): Set<string> {
  const ignored = new Set(["with", "from", "this", "that", "the", "and", "for", "new", "best", "buy", "online", "flipkart"]);
  return new Set(text.toLowerCase().match(/[a-z0-9]{2,}/g)?.filter((word) => !ignored.has(word)) ?? []);
}

function relevanceScore(title: string, reference: string, price: number | null, referencePrice: number | null): number {
  const a = tokenize(title);
  const b = tokenize(reference);
  const overlap = a.size ? [...a].filter((word) => b.has(word)).length / a.size : 0;
  const priceFit = price && referencePrice ? Math.max(0, 1 - Math.abs(price - referencePrice) / Math.max(price, referencePrice)) : 0.35;
  return Math.round(Math.min(100, overlap * 75 + priceFit * 25));
}

function extractCompetitors(title: string, price: number | null): CompetitorData[] {
  const cards = new Map<string, CompetitorData>();
  document.querySelectorAll<HTMLAnchorElement>('a[href*="/p/"]').forEach((anchor) => {
    const url = new URL(anchor.href, location.href);
    if (!isFlipkartUrl(url.href)) return;
    const productId = extractProductId(url.href);
    if (!productId || productId === extractProductId(location.href)) return;
    const container = anchor.closest("article") ?? anchor.closest('[data-id]') ?? anchor.parentElement?.parentElement;
    const titleNode = container?.querySelector("a[title], img[alt], [title]");
    const candidateTitle = titleNode?.getAttribute("title") ?? (titleNode instanceof HTMLImageElement ? titleNode.alt : null) ?? textOf(anchor);
    if (!candidateTitle || candidateTitle.length < 8) return;
    const text = textOf(container) ?? "";
    const image = container?.querySelector("img")?.getAttribute("src") ?? null;
    const cardPrice = parsePrice(text.match(currencyPattern)?.[0] ?? null);
    const ratingMatch = text.match(/([0-5](?:\.\d+)?)\s*(?:★|stars?)/i);
    const competitor: CompetitorData = {
      productId,
      title: candidateTitle.slice(0, 240),
      url: url.href,
      price: cardPrice,
      rating: ratingMatch ? Number(ratingMatch[1]) : null,
      ratingCount: parseCount(text.match(countPattern)?.[0] ?? null),
      reviewCount: parseCount(text.match(/([\d,.]+\s*[KLM]?)\s*reviews?/i)?.[0] ?? null),
      image,
      relevance: relevanceScore(candidateTitle, title, cardPrice, price),
    };
    const existing = cards.get(productId);
    if (!existing || competitor.relevance > existing.relevance) cards.set(productId, competitor);
  });
  return [...cards.values()].filter((item) => item.relevance >= 25).sort((a, b) => b.relevance - a.relevance).slice(0, 20);
}

export function extractFlipkartProduct(): ProductData {
  const json = jsonLdProducts()[0];
  const structured = json ? productFromJsonLd(json) : {};
  const titleDom = firstText(["h1", "span.B_NuCI", "[data-testid='product-title']"]);
  const currentPriceDom = firstText(["[data-testid='price'] ", "div.Nx9bqj.CxhGGd", "div._30jeq3._16Jk6d"]);
  const mrpDom = firstText(["[class*='yRaY8j']", "div._3I9_wc._2p6lqe", "[class*='mrp']"]);
  const ratingDom = firstText(["div.XQDdHH", "div._3LWZlK", "[aria-label*='out of 5']"]);
  const price = structured.currentPrice ?? findPrice(currentPriceDom.value) ?? findPrice(textOf(document.querySelector("body"))?.match(currencyPattern)?.[0] ?? null);
  const title = structured.title ?? titleDom.value ?? document.title.replace(/\s*:\s*Flipkart\.com.*$/i, "").trim() ?? null;
  const brand = structured.brand ?? null;
  const mrp = findPrice(mrpDom.value);
  const ratingText = ratingDom.value ?? visibleText().match(/[0-5](?:\.\d+)?\s*(?:out of 5|★)/i)?.[0] ?? null;
  const rating = structured.rating ?? (ratingText ? Number(ratingText.match(/[0-5](?:\.\d+)?/)?.[0]) || null : null);
  const ratingCount = structured.ratingCount ?? findRatingCount();
  const reviewCount = structured.reviewCount ?? findReviewCount();
  const productId = extractProductId(location.href);
  const image = structured.image ?? document.querySelector<HTMLImageElement>("img[fetchpriority='high'], img._396cs4")?.src ?? null;
  const distribution = emptyDistribution();
  const bodyText = visibleText();
  for (const star of [1, 2, 3, 4, 5] as const) {
    const count = bodyText.match(new RegExp(`(?:${star}\\s*star|${star}★)[^\\d]{0,24}([\\d,.]+\\s*[KLM]?)`, "i"))?.[1];
    if (count) distribution[star] = parseIndianNumber(count);
  }
  const unavailable = /currently unavailable|out of stock/i.test(bodyText);
  const capturedAt = new Date().toISOString();
  const reviews = extractReviews();
  const competitors = extractCompetitors(title ?? "", price);
  const distributionAvailable = Object.values(distribution).some((value) => value !== null);
  const fields: ProductData["fields"] = {
    title: field(title, structured.title ? "json-ld" : titleDom.selector ? "dom" : null, title ? structured.title ? "high" : "medium" : "low"),
    currentPrice: field(price, structured.currentPrice ? "json-ld" : currentPriceDom.selector ? "dom" : price ? "text" : null, price ? structured.currentPrice ? "high" : currentPriceDom.selector ? "medium" : "low" : "low"),
    rating: field(rating, structured.rating ? "json-ld" : ratingDom.selector ? "dom" : null, rating ? "high" : "low"),
    ratingCount: field(ratingCount, structured.ratingCount ? "json-ld" : ratingCount ? "text" : null, ratingCount ? "medium" : "low"),
    reviewCount: field(reviewCount, structured.reviewCount ? "json-ld" : reviewCount ? "text" : null, reviewCount ? "medium" : "low"),
    image: field(image, structured.image ? "json-ld" : image ? "dom" : null, image ? "medium" : "low"),
    ratingDistribution: field(distributionAvailable ? distribution : null, distributionAvailable ? "text" : null, "low"),
    reviews: field(reviews.length ? reviews.length : null, reviews.length ? "dom" : null, reviews.length >= 5 ? "medium" : "low"),
    competitors: field(competitors.length ? competitors.length : null, competitors.length ? "dom" : null, competitors.length >= 5 ? "medium" : "low"),
  };

  return {
    marketplace: "flipkart",
    productId,
    url: location.href,
    title: title || null,
    brand,
    category: null,
    currentPrice: price,
    mrp,
    discount: mrp && price && mrp > price ? Math.round((1 - price / mrp) * 100) : null,
    rating: rating !== null && rating >= 0 && rating <= 5 ? rating : null,
    ratingCount,
    reviewCount,
    ratingDistribution: distribution,
    availability: unavailable ? "unavailable" : price ? "available" : "unknown",
    seller: null,
    image,
    reviews,
    competitors,
    fields,
    capturedAt,
  };
}

export function getPageType(url: string): "product" | "search" | "unsupported" {
  if (!isFlipkartUrl(url)) return "unsupported";
  const parsed = new URL(url);
  if (extractProductId(url)) return "product";
  if (parsed.pathname === "/search" || parsed.searchParams.has("q")) return "search";
  return "unsupported";
}
