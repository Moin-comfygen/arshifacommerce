import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, BarChart3, CheckCircle2, ExternalLink, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import "./popup.css";

type PageInfo = { supported: boolean; pageType: "product" | "search" | "unsupported"; title: string | null; price: string | null; rating: string | null; image: string | null };

function Popup() {
  const [page, setPage] = useState<PageInfo | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [hasReport, setHasReport] = useState(false);

  useEffect(() => {
    void chrome.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      setTabId(tab.id);
      try {
        const info = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_INFO" }) as PageInfo;
        setPage(info);
      } catch {
        setPage({ supported: false, pageType: "unsupported", title: null, price: null, rating: null, image: null });
      }
    });
    void chrome.storage.local.get("lastAnalysisId").then(({ lastAnalysisId }) => setHasReport(Boolean(lastAnalysisId)));
  }, []);

  async function runAnalysis(type: "ANALYZE_CURRENT" | "ANALYZE_URL", value?: string) {
    setBusy(true);
    setMessage("Reading visible product information…");
    try {
      const response = await chrome.runtime.sendMessage({
        type,
        ...(type === "ANALYZE_CURRENT" ? { tabId } : { url: value }),
      }) as { ok: boolean; error?: string };
      if (!response.ok) throw new Error(response.error || "Analysis could not be completed.");
      setMessage("Report ready. Opening your local dashboard…");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis could not be completed.");
      setBusy(false);
    }
  }

  async function openReport() {
    setBusy(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: "OPEN_LATEST" }) as { ok: boolean; error?: string };
      if (!response.ok) throw new Error(response.error || "No saved report yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open the saved report.");
      setBusy(false);
    }
  }

  function submitUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      setMessage("Please enter a valid Flipkart product URL.");
      return;
    }
    if (parsed.protocol !== "https:" || !["www.flipkart.com", "flipkart.com"].includes(parsed.hostname) || !/\/p\/[a-z0-9]+/i.test(parsed.pathname)) {
      setMessage("Please enter a valid Flipkart product URL.");
      return;
    }
    void runAnalysis("ANALYZE_URL", parsed.href);
  }

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div className="brand-icon"><BarChart3 size={18} strokeWidth={2.4} /></div>
        <div><strong>Product360</strong><span>Seller research</span></div>
        <span className="local-badge"><ShieldCheck size={13} /> LOCAL</span>
      </header>

      {page?.pageType === "product" ? (
        <section className="product-preview" aria-label="Detected product">
          <div className="eyebrow"><span className="live-dot" /> PRODUCT DETECTED</div>
          <div className="preview-row">
            {page.image ? <img className="product-thumb" src={page.image} alt="" /> : <div className="product-thumb thumb-empty"><BarChart3 size={20} /></div>}
            <div className="preview-copy">
              <h1>{page.title || "Flipkart product"}</h1>
              <p>{page.price || "Price unavailable"} {page.rating ? <span>· ★ {page.rating}</span> : null}</p>
            </div>
          </div>
          <p className="data-notice">Product details and accessible page content are processed locally when you use Product360. Reports stay on this device and are not sent to a server.</p>
          <button className="primary-button" disabled={busy || tabId === null} onClick={() => void runAnalysis("ANALYZE_CURRENT")}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Search size={16} />}
            {busy ? "Analyzing…" : "Analyze product"}
            {!busy && <ArrowUpRight size={15} />}
          </button>
        </section>
      ) : (
        <section className="unsupported-card">
          <div className="empty-icon"><Search size={19} /></div>
          <div>
            <h1>{page?.pageType === "search" ? "Flipkart search page" : "No product detected"}</h1>
            <p>Open a product detail page, or paste its Flipkart URL below.</p>
          </div>
        </section>
      )}

      {page?.pageType !== "product" && <p className="data-notice standalone-notice">Product360 reads Flipkart page content only when you open it. Reports are processed and stored locally on this device.</p>}

      <form className="url-form" onSubmit={submitUrl}>
        <label htmlFor="product-url">Paste Flipkart product URL</label>
        <div className="url-entry">
          <input id="product-url" type="url" placeholder="https://www.flipkart.com/…" value={url} onChange={(event) => setUrl(event.target.value)} />
          <button type="submit" aria-label="Analyze URL" disabled={busy || !url.trim()}><ArrowUpRight size={16} /></button>
        </div>
      </form>

      {message && <p className={`status-message ${message.includes("ready") ? "success" : ""}`} role="status">{message}</p>}

      <button className="report-link" onClick={() => void openReport()} disabled={!hasReport || busy}>
        <span><CheckCircle2 size={16} /> {hasReport ? "Open latest report" : "Your saved reports appear here"}</span>
        <ExternalLink size={14} />
      </button>
      <footer className="popup-footer">Estimates are directional, never confirmed sales.</footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
