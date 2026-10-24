import type { AnalysisRecord, ProductData, Snapshot } from "../types";

const DATABASE_NAME = "product360-local";
const DATABASE_VERSION = 1;
const SNAPSHOT_COOLDOWN_MS = 30 * 60 * 1000;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("analyses")) db.createObjectStore("analyses", { keyPath: "id" });
      if (!db.objectStoreNames.contains("snapshots")) {
        const store = db.createObjectStore("snapshots", { keyPath: "id" });
        store.createIndex("byProduct", "productId", { unique: false });
      }
      if (!db.objectStoreNames.contains("products")) db.createObjectStore("products", { keyPath: "productId" });
      if (!db.objectStoreNames.contains("audit")) db.createObjectStore("audit", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local research storage."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage request failed."));
  });
}

export async function getHistory(productId: string | null): Promise<Snapshot[]> {
  if (!productId) return [];
  const db = await openDatabase();
  const tx = db.transaction("snapshots", "readonly");
  const request = tx.objectStore("snapshots").index("byProduct").getAll(productId);
  const rows = await requestResult(request) as Snapshot[];
  db.close();
  return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const db = await openDatabase();
  const record = await requestResult(db.transaction("analyses", "readonly").objectStore("analyses").get(id)) as AnalysisRecord | undefined;
  db.close();
  return record ?? null;
}

export async function getLatestAnalysis(): Promise<AnalysisRecord | null> {
  const db = await openDatabase();
  const rows = await requestResult(db.transaction("analyses", "readonly").objectStore("analyses").getAll()) as AnalysisRecord[];
  db.close();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function saveAnalysis(record: AnalysisRecord): Promise<void> {
  const db = await openDatabase();
  const existingSnapshots = await requestResult(
    db.transaction("snapshots", "readonly").objectStore("snapshots").index("byProduct").getAll(record.product.productId ?? record.id),
  ) as Snapshot[];
  const latest = existingSnapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const snapshot: Snapshot = {
    id: `${record.product.productId ?? "unknown"}-${record.createdAt}`,
    productId: record.product.productId ?? record.id,
    timestamp: record.createdAt,
    price: record.product.currentPrice,
    rating: record.product.rating,
    ratingCount: record.product.ratingCount,
    reviewCount: record.product.reviewCount,
    availability: record.product.availability,
  };
  const tx = db.transaction(["analyses", "snapshots", "products", "audit"], "readwrite");
  if (!latest || Date.now() - new Date(latest.timestamp).getTime() >= SNAPSHOT_COOLDOWN_MS) {
    tx.objectStore("snapshots").put(snapshot);
  }
  tx.objectStore("analyses").put(record);
  if (record.product.productId) tx.objectStore("products").put(record.product);
  tx.objectStore("audit").put({
    id: record.id,
    timestamp: record.createdAt,
    productId: record.product.productId,
    recommendation: record.scores.recommendation,
    scoreBreakdown: record.scores,
    observedData: record.product,
  });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save the analysis."));
    tx.onabort = () => reject(tx.error ?? new Error("Analysis storage transaction was aborted."));
  });
  db.close();
}

export async function getProductAnalyses(productId: string | null): Promise<AnalysisRecord[]> {
  if (!productId) return [];
  const db = await openDatabase();
  const rows = await requestResult(db.transaction("analyses", "readonly").objectStore("analyses").getAll()) as AnalysisRecord[];
  db.close();
  return rows.filter((row) => row.product.productId === productId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function trimOldRecords(maxRecords = 500): Promise<void> {
  const db = await openDatabase();
  if (!Number.isInteger(maxRecords) || maxRecords < 1) {
    db.close();
    throw new Error("History retention limit must be a positive integer.");
  }
  const recordsByStore = new Map<string, Array<{ id?: string; productId?: string; timestamp?: string; createdAt?: string; capturedAt?: string }>>();
  const names = ["analyses", "snapshots", "audit", "products"];
  const readTx = db.transaction(names, "readonly");
  const readRequests = names.map((name) => readTx.objectStore(name).getAll());
  const readRows = await Promise.all(readRequests.map((request) => requestResult(request)));
  names.forEach((name, index) => recordsByStore.set(name, readRows[index] as Array<{ id?: string; productId?: string; timestamp?: string; createdAt?: string; capturedAt?: string }>));
  const tx = db.transaction(names, "readwrite");
  for (const name of ["analyses", "snapshots", "audit"]) {
    const store = tx.objectStore(name);
    const records = recordsByStore.get(name) ?? [];
    if (records.length <= maxRecords) continue;
    records.sort((a, b) => (a.timestamp ?? a.createdAt ?? a.capturedAt ?? "").localeCompare(b.timestamp ?? b.createdAt ?? b.capturedAt ?? ""));
    records.slice(0, records.length - maxRecords).forEach((record) => {
      const key = name === "products" ? record.productId : record.id;
      if (key) store.delete(key);
    });
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not trim local history."));
    tx.onabort = () => reject(tx.error ?? new Error("History cleanup was aborted."));
  });
  db.close();
}

export async function getPreference(key: string): Promise<string | null> {
  const values = await chrome.storage.local.get(key);
  return typeof values[key] === "string" ? values[key] : null;
}

export async function setPreference(key: string, value: string): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export type StoredProduct = ProductData;
