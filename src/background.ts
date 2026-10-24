import { createAnalysis } from "./analytics";
import { getHistory, saveAnalysis, trimOldRecords } from "./storage/database";
import type { ProductData } from "./types";
import { isFlipkartUrl } from "./marketplaces/flipkart/extract";

type ExtractionResponse = { ok?: boolean; product?: ProductData; error?: string; pageType?: string };

async function extractFromTab(tabId: number): Promise<ProductData> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let response: ExtractionResponse;
    try {
      response = await chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PRODUCT" }) as ExtractionResponse;
    } catch (error) {
      lastError = error;
      if (attempt < 9) await new Promise((resolve) => setTimeout(resolve, 700));
      continue;
    }
    if (!response?.ok || !response.product) throw new Error(response?.error ?? "Product data was not available on this page.");
    if (response.pageType !== "product" || !response.product.productId) {
      throw new Error("Open a Flipkart product detail page before analyzing.");
    }
    if (!response.product.title) throw new Error("The product title could not be read. The page may have changed.");
    return response.product;
  }
  throw new Error(lastError instanceof Error ? lastError.message : "Could not connect to the Flipkart page. Refresh it and try again.");
}

async function finishAnalysis(product: ProductData): Promise<string> {
  const history = await getHistory(product.productId);
  const record = createAnalysis(product, history);
  await saveAnalysis(record);
  await trimOldRecords();
  await chrome.storage.local.set({ lastAnalysisId: record.id });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`dashboard.html?id=${encodeURIComponent(record.id)}`) });
  return record.id;
}

async function analyzeCurrent(tabId: number): Promise<string> {
  const product = await extractFromTab(tabId);
  return finishAnalysis(product);
}

async function analyzeUrl(url: string): Promise<string> {
  if (!isFlipkartUrl(url) || !/\/p\/[a-z0-9]+/i.test(new URL(url).pathname)) {
    throw new Error("Please enter a valid Flipkart product URL.");
  }
  const tab = await chrome.tabs.create({ url, active: true });
  if (tab.id === undefined) throw new Error("Chrome could not open the product page.");
  const product = await extractFromTab(tab.id);
  return finishAnalysis(product);
}

chrome.runtime.onMessage.addListener((message: { type?: string; tabId?: number; url?: string }, _sender, sendResponse) => {
  if (message.type === "ANALYZE_CURRENT" && typeof message.tabId === "number") {
    analyzeCurrent(message.tabId)
      .then((id) => sendResponse({ ok: true, id }))
      .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Analysis could not be completed." }));
    return true;
  }
  if (message.type === "ANALYZE_URL" && typeof message.url === "string") {
    analyzeUrl(message.url)
      .then((id) => sendResponse({ ok: true, id }))
      .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Analysis could not be completed." }));
    return true;
  }
  if (message.type === "OPEN_LATEST") {
    chrome.storage.local.get("lastAnalysisId").then(async ({ lastAnalysisId }) => {
      if (!lastAnalysisId) throw new Error("No saved report yet. Analyze a product first.");
      await chrome.tabs.create({ url: chrome.runtime.getURL(`dashboard.html?id=${encodeURIComponent(String(lastAnalysisId))}`) });
      sendResponse({ ok: true });
    }).catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Could not open the report." }));
    return true;
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({ installedVersion: chrome.runtime.getManifest().version });
});
