import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowDownUp, ArrowUpRight, BarChart3, CircleHelp, ExternalLink, FileSearch, History, LayoutDashboard, Lightbulb, MessageSquareText, ShieldCheck, Store, Wallet, type LucideIcon } from "lucide-react";
import { calculateCompetition } from "../analytics/competitionScore";
import { calculateCompetitorMetrics } from "../analytics/competitorMetrics";
import { getAnalysis, getHistory, getLatestAnalysis } from "./storage";
import { getPreference, setPreference } from "../storage/database";
import type { AnalysisRecord, Snapshot } from "../types";
import "./dashboard.css";

type Section = "Overview" | "Competition" | "Reviews" | "Demand" | "History" | "Profit" | "Methodology";
const navigation: { name: Section; icon: LucideIcon }[] = [
  { name: "Overview", icon: LayoutDashboard }, { name: "Competition", icon: Store },
  { name: "Reviews", icon: MessageSquareText }, { name: "Demand", icon: BarChart3 },
  { name: "History", icon: History }, { name: "Profit", icon: Wallet },
  { name: "Methodology", icon: FileSearch },
];
const currency = (value: number | null | undefined) => value === null || value === undefined ? "Unavailable" : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
const compact = (value: number | null | undefined) => value === null || value === undefined ? "—" : new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const scoreLabel = (score: number, type: "demand" | "competition" | "opportunity") => {
  if (type === "demand") return score >= 85 ? "Very high" : score >= 70 ? "High" : score >= 50 ? "Good" : score >= 30 ? "Moderate" : "Low";
  if (type === "competition") return score >= 70 ? "Very high" : score >= 50 ? "High" : score >= 30 ? "Moderate" : "Low";
  return score >= 75 ? "Strong" : score >= 50 ? "Developing" : "Limited";
};

function ScoreCard({ title, score, type, note }: { title: string; score: number; type: "demand" | "competition" | "opportunity"; note?: string }) {
  return <article className={`score-card ${type}`}>
    <div className="score-label">{title}<CircleHelp size={13} aria-label={`${title} is an indicative local score`} /></div>
    <div className="score-number">{score}<span>/100</span></div>
    <div className="score-foot"><strong>{scoreLabel(score, type)}</strong>{note && <span>{note}</span>}</div>
    <div className="score-track"><span style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} /></div>
  </article>;
}

function Dashboard() {
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [section, setSection] = useState<Section>("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [debug, setDebug] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [costs, setCosts] = useState({ product: "", shipping: "", fees: "", packaging: "", ads: "", other: "" });

  useEffect(() => {
    void (async () => {
      try {
        const id = new URLSearchParams(location.search).get("id");
        const item = id ? await getAnalysis(id) : await getLatestAnalysis();
        if (!item) throw new Error("No saved product report was found on this device.");
        setRecord(item);
        setHistory(await getHistory(item.product.productId));
        setDebug((await getPreference("debugMode")) === "true");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load the local report.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortedCompetitors = useMemo(() => {
    const rows = [...(record?.product.competitors ?? [])];
    const selectors: Record<string, (a: typeof rows[number], b: typeof rows[number]) => number> = {
      relevance: (a, b) => b.relevance - a.relevance,
      price: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
      ratings: (a, b) => (b.ratingCount ?? -1) - (a.ratingCount ?? -1),
    sales: () => 0,
    opportunity: () => 0,
    };
    return rows.sort(selectors[sortBy] ?? selectors.relevance);
  }, [record, sortBy]);

  function openCompetitor(url: string, analyze = false) {
    if (analyze) {
      setActionMessage("Opening the selected listing for analysis…");
      void chrome.runtime.sendMessage({ type: "ANALYZE_URL", url })
        .then((response: { ok?: boolean; error?: string }) => {
          if (!response?.ok) setActionMessage(response?.error ?? "Could not analyze this listing.");
          else setActionMessage("Analysis complete. The report opened in a new tab.");
        })
        .catch(() => setActionMessage("Could not connect to the extension service worker. Try again."));
      return;
    }
    void chrome.tabs.create({ url, active: true });
  }

  if (loading) return <main className="loading-screen"><div className="loading-logo"><BarChart3 size={22} /></div><p>Loading your local research…</p></main>;
  if (error || !record) return <main className="empty-screen"><div className="loading-logo"><FileSearch size={22} /></div><h1>Report unavailable</h1><p>{error || "No analysis has been saved yet."}</p><p>Open a Flipkart product and analyze it with Product360.</p></main>;

  const { product, scores } = record;
  const reportHasHistory = history.length > 1;
  const monthlyUnits = scores.estimatedMonthlySales;
  const costsComplete = Object.values(costs).every((value) => value.trim() !== "");
  const currentCosts = Object.values(costs).map(Number);
  const costsValid = currentCosts.every((value) => Number.isFinite(value) && value >= 0);
  const totalUnitCost = currentCosts.reduce((sum, value) => sum + value, 0);
  const profitPerUnit = product.currentPrice === null || !costsComplete || !costsValid ? null : product.currentPrice - totalUnitCost;
  const margin = profitPerUnit !== null && product.currentPrice ? profitPerUnit / product.currentPrice * 100 : null;
  const monthlyProfit = monthlyUnits && profitPerUnit !== null
    ? [monthlyUnits.low * profitPerUnit, monthlyUnits.high * profitPerUnit].sort((a, b) => a - b)
    : null;
  const pricingCompetitors = product.competitors.map((item) => item.price).filter((price): price is number => price !== null);
  const medianPrice = pricingCompetitors.length ? [...pricingCompetitors].sort((a, b) => a - b)[Math.floor(pricingCompetitors.length / 2)] : null;
  const marketAveragePrice = pricingCompetitors.length ? pricingCompetitors.reduce((sum, price) => sum + price, 0) / pricingCompetitors.length : null;
  const marketCompetition = calculateCompetition(product.competitors).score;
  const competitorRows = sortedCompetitors.map((item) => ({
    item,
    metrics: calculateCompetitorMetrics(item, marketCompetition, marketAveragePrice),
  }));
  const sortedCompetitorRows = competitorRows.sort((a, b) => {
    if (sortBy === "sales") return (b.metrics.estimatedMonthlySales?.high ?? -1) - (a.metrics.estimatedMonthlySales?.high ?? -1);
    if (sortBy === "opportunity") return b.metrics.opportunity - a.metrics.opportunity;
    return 0;
  });

  const renderOverview = () => <>
    <section className="product-banner">
      {product.image ? <img src={product.image} alt="" /> : <div className="image-placeholder"><BarChart3 size={26} /></div>}
      <div className="product-main">
        <div className="eyebrow">FLIPKART PRODUCT · {product.productId ?? "ID UNAVAILABLE"}</div>
        <h1>{product.title ?? "Product title unavailable"}</h1>
        <div className="product-meta">
          <strong>{currency(product.currentPrice)}</strong>
          {product.mrp && <del>{currency(product.mrp)}</del>}
          {product.discount !== null && <span className="discount">{product.discount}% off</span>}
          {product.rating !== null && <span className="rating-chip">★ {product.rating.toFixed(1)}</span>}
          {product.ratingCount !== null && <span>{compact(product.ratingCount)} ratings</span>}
        </div>
      </div>
      <button className="outline-button" onClick={() => openCompetitor(product.url)}><ExternalLink size={15} /> Open listing</button>
    </section>

    <section className="score-grid" aria-label="Product scores">
      <ScoreCard title="DEMAND" score={scores.demand} type="demand" />
      <ScoreCard title="COMPETITION" score={scores.competition} type="competition" />
      <article className="score-card sales-card">
        <div className="score-label">EST. MONTHLY SALES <CircleHelp size={13} aria-label="Estimated from visible marketplace signals, not verified sales" /></div>
        <div className="sales-number">{monthlyUnits ? `${compact(monthlyUnits.low)}–${compact(monthlyUnits.high)}` : "—"}<span> units</span></div>
        <div className="score-foot"><strong>{scores.confidence}% confidence</strong><span>Model estimate</span></div>
        <div className="estimate-disclaimer">Not verified Flipkart sales</div>
      </article>
      <ScoreCard title="OPPORTUNITY" score={scores.opportunity} type="opportunity" />
    </section>

    <section className={`recommendation ${scores.recommendation.toLowerCase()}`}>
      <div className="recommendation-icon"><Lightbulb size={20} /></div>
      <div className="recommendation-copy">
        <div className="eyebrow">PRODUCT360 RECOMMENDATION</div>
        <h2>{scores.recommendation === "SELL" ? "Worth pursuing" : scores.recommendation === "TEST" ? "Test with limited inventory" : "Avoid for now"}</h2>
        <p>{scores.recommendation === "TEST" ? "The current evidence is directional. Validate costs, supplier quality, and demand with a small test before committing." : scores.recommendation === "SELL" ? "Multiple observed signals are positive, but independently verify unit economics and supply before listing." : "Available evidence is weak or too incomplete to support an investment decision."}</p>
      </div>
      <span className={`decision-pill ${scores.recommendation.toLowerCase()}`}>{scores.recommendation}</span>
    </section>

    <section className="two-column">
      <article className="panel">
        <div className="panel-heading"><h2>Why this score?</h2><span className="muted">Evidence-led</span></div>
        <ul className="reason-list">{scores.reasons.map((reason) => <li key={reason}><span className="check-mark">✓</span>{reason}</li>)}</ul>
      </article>
      <article className="panel">
        <div className="panel-heading"><h2>Risks to consider</h2><span className="muted">Before investing</span></div>
        {scores.risks.length ? <ul className="risk-list">{scores.risks.map((risk) => <li key={risk}><span>!</span>{risk}</li>)}</ul> : <p className="muted">No material data gaps were flagged.</p>}
      </article>
    </section>
    <section className="panel competitor-preview">
      <div className="panel-heading"><div><h2>Visible competitor snapshot</h2><p>Listings detected on the page you analyzed</p></div><button className="text-button" onClick={() => setSection("Competition")}>View all <ArrowUpRight size={14} /></button></div>
      {sortedCompetitors.length ? <div className="mini-competitors">{sortedCompetitors.slice(0, 3).map((item) => <div className="mini-row" key={item.productId ?? item.url}><span>{item.title}</span><strong>{currency(item.price)}</strong><span>★ {item.rating?.toFixed(1) ?? "—"}</span></div>)}</div> : <div className="notice-box">No relevant competitor listings were found in the visible page content. Use a Flipkart search-results page to collect listings; none are fabricated in this report.</div>}
    </section>
  </>;

  const renderCompetition = () => <>
    <section className="page-heading"><div><div className="eyebrow">MARKET LANDSCAPE</div><h1>Competition</h1><p>Only listings available in the analyzed page are included.</p></div><label className="sort-control"><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort competitors">    <option value="relevance">Relevance</option><option value="sales">Highest estimated sales</option><option value="ratings">Most ratings</option><option value="rating">Highest rating</option><option value="price">Lowest price</option><option value="opportunity">Highest opportunity</option></select><ArrowDownUp size={14} /></label></section>
    <section className="stat-grid">
      <article className="stat-card"><span>VISIBLE LISTINGS</span><strong>{product.competitors.length}</strong></article>
      <article className="stat-card"><span>MEDIAN OBSERVED PRICE</span><strong>{currency(medianPrice)}</strong></article>
      <article className="stat-card"><span>MEDIAN OBSERVED RATING</span><strong>{product.competitors.filter((item) => item.rating !== null).length ? `${(product.competitors.filter((item) => item.rating !== null).reduce((sum, item) => sum + (item.rating ?? 0), 0) / product.competitors.filter((item) => item.rating !== null).length).toFixed(1)} / 5` : "—"}</strong></article>
      <article className="stat-card"><span>YOUR PRICE POSITION</span><strong>{product.currentPrice && medianPrice ? `${Math.round((product.currentPrice / medianPrice - 1) * 100)}%` : "—"}</strong><small>{product.currentPrice && medianPrice ? "vs. median competitor price" : "Price comparison unavailable"}</small></article>
    </section>
    {actionMessage && <p className="action-status" role="status">{actionMessage}</p>}
    {sortedCompetitors.length ? <section className="panel table-panel">
      <div className="table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Rating</th><th>Ratings</th><th>Est. monthly sales</th><th>Demand</th><th>Competition</th><th>Opportunity</th><th></th></tr></thead>
        <tbody>{sortedCompetitorRows.map(({ item, metrics }) => <tr key={item.productId ?? item.url}>
          <td><div className="competitor-cell">{item.image ? <img src={item.image} alt="" /> : <div className="tiny-placeholder"><Store size={15} /></div>}<span>{item.title}</span></div></td>
          <td>{currency(item.price)}</td><td>{item.rating === null ? "—" : `★ ${item.rating.toFixed(1)}`}</td><td>{compact(item.ratingCount)}</td>
          <td><span title="Estimate based on visible listing signals; not verified sales">{metrics.estimatedMonthlySales ? `${compact(metrics.estimatedMonthlySales.low)}–${compact(metrics.estimatedMonthlySales.high)}` : "—"}<small className="cell-note"> est. · {metrics.confidence}% conf.</small></span></td>
          <td>{metrics.demand}/100</td><td>{metrics.competition}/100</td><td><span className="relevance-chip">{metrics.opportunity}/100</span></td>
          <td><div className="row-actions"><button className="analyze-button" onClick={() => openCompetitor(item.url, true)}>Analyze <ArrowUpRight size={13} /></button><button className="icon-button" onClick={() => openCompetitor(item.url)} aria-label={`Open ${item.title} on Flipkart`}><ExternalLink size={13} /></button></div></td>
        </tr>)}</tbody></table></div>
    </section> : <section className="panel empty-panel"><div className="empty-illustration"><Store size={23} /></div><h2>No competitors found</h2><p>Competitor listings are extracted only from content already visible to you. Open Flipkart search results to inspect comparisons; Product360 does not send bulk requests.</p><button className="primary-small" onClick={() => openCompetitor(`https://www.flipkart.com/search?q=${encodeURIComponent(product.title ?? "")}`)}>Open a Flipkart search <ArrowUpRight size={14} /></button></section>}
  </>;

  const renderReviews = () => <>
    <section className="page-heading"><div><div className="eyebrow">CUSTOMER VOICE</div><h1>Review insights</h1><p>On-device text analysis of review content accessible on the product page.</p></div></section>
    <section className="panel">
      <div className="panel-heading"><div><h2>Customer sentiment</h2><p>Based on {scores.themes.sampleSize} accessible review samples</p></div><span className="sample-pill">{scores.themes.sampleSize} samples</span></div>
      {scores.customerSentiment.positive === null ? <div className="notice-box">Review text was not available in sufficient quantity to estimate sentiment. Rating counts are not treated as review sentiment.</div> : <div className="sentiment-list">
        {(["positive", "neutral", "negative"] as const).map((key) => <div className="sentiment-row" key={key}><span>{key}</span><div className={`sentiment-track ${key}`}><i style={{ width: `${scores.customerSentiment[key] ?? 0}%` }} /></div><strong>{scores.customerSentiment[key]}%</strong></div>)}
      </div>}
    </section>
    <section className="two-column review-panels">
      <article className="panel"><div className="panel-heading"><h2>What customers love</h2><span className="sentiment-icon positive">+</span></div>{scores.themes.positive.length ? <ul className="theme-list">{scores.themes.positive.map((theme) => <li key={theme}>{theme}</li>)}</ul> : <p className="muted">No repeated positive themes in the accessible sample.</p>}</article>
      <article className="panel"><div className="panel-heading"><h2>Recurring pain points</h2><span className="sentiment-icon negative">−</span></div>{scores.themes.negative.length ? <ul className="theme-list">{scores.themes.negative.map((theme) => <li key={theme}>{theme}</li>)}</ul> : <p className="muted">No repeated negative themes in the accessible sample.</p>}</article>
    </section>
    <section className="panel"><div className="panel-heading"><h2>Seller opportunities</h2><Lightbulb size={16} /></div>{scores.themes.negative.length ? <p className="opportunity-note">Consider addressing reported issues such as {scores.themes.negative.join(", ").toLowerCase()} through product quality, packaging, or clearer listing information. Validate this small sample before acting.</p> : <p className="muted">Opportunities are not inferred without repeated review evidence.</p>}</section>
  </>;

  const renderDemand = () => <>
    <section className="page-heading"><div><div className="eyebrow">SIGNAL BREAKDOWN</div><h1>Demand analysis</h1><p>Demand is a directional score from visible product and market signals.</p></div></section>
    <section className="demand-hero panel"><div className="demand-score">{scores.demand}<span>/100</span></div><div><div className="eyebrow">DEMAND · {scoreLabel(scores.demand, "demand").toUpperCase()}</div><h2>{scores.demand >= 60 ? "Customer activity is visible" : "Demand signals are limited"}</h2><p>{product.ratingCount !== null || product.reviewCount !== null ? "Marketplace ratings and reviews provide observed activity proxies, not confirmed unit sales." : "Ratings and review activity were unavailable; this score has low informational value."}</p></div></section>
    <section className="panel"><div className="panel-heading"><h2>Contributing signals</h2><span className="muted">Observed and derived</span></div>
      <SignalRow label="Rating & review activity" value={scores.components.observedActivity} note={product.ratingCount !== null ? `${compact(product.ratingCount)} ratings observed` : "Activity counts unavailable"} />
      <SignalRow label="Historical momentum" value={scores.components.historicalVelocity} note={reportHasHistory ? "Derived from local snapshots" : "More snapshots needed"} />
      <SignalRow label="Visible market depth" value={scores.components.visibleCompetitors === null ? null : Math.min(100, scores.components.visibleCompetitors * 10)} note={`${scores.components.visibleCompetitors ?? 0} relevant listings`} />
      <SignalRow label="Data confidence" value={scores.confidence} note="Completeness of the available signals" />
    </section>
  </>;

  const renderHistory = () => <>
    <section className="page-heading"><div><div className="eyebrow">LOCAL TRACKING</div><h1>Price & activity history</h1><p>Snapshots stay in this browser profile.</p></div></section>
    {history.length >= 2 ? <><section className="panel chart-panel"><div className="panel-heading"><div><h2>Price movement</h2><p>Observed product price by analysis snapshot</p></div><span className="sample-pill">{history.length} snapshots</span></div><SnapshotChart rows={history} value={(row) => row.price} format={currency} /></section>
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Ratings history</h2><p>Cumulative marketplace rating count (when visible)</p></div></div><SnapshotChart rows={history} value={(row) => row.ratingCount} format={compact} /></section></> :
      <section className="panel empty-panel"><div className="empty-illustration"><History size={23} /></div><h2>History is still being collected</h2><p>Analyze this product again after some time. Snapshots are deduplicated for 30 minutes to avoid redundant entries.</p><div className="history-facts"><span>{history.length} saved snapshot</span><span>Local storage only</span></div></section>}
  </>;

  const renderProfit = () => <>
    <section className="page-heading"><div><div className="eyebrow">UNIT ECONOMICS</div><h1>Profit calculator</h1><p>Enter your own costs. Unknown costs are never guessed.</p></div></section>
    <section className="profit-layout">
      <article className="panel costs-panel"><div className="panel-heading"><h2>Per-unit costs</h2><span>₹ INR</span></div><p className="cost-guidance">Enter 0 for any cost that does not apply. Results appear once every cost is specified.</p>
        {([["product", "Product cost"], ["shipping", "Shipping"], ["fees", "Marketplace fees"], ["packaging", "Packaging"], ["ads", "Advertising"], ["other", "Other costs"]] as const).map(([key, label]) => <label className="cost-field" key={key}><span>{label}</span><div><span>₹</span><input type="number" min="0" step="0.01" value={costs[key]} onChange={(event) => setCosts({ ...costs, [key]: event.target.value })} placeholder="Required" aria-label={`${label} per unit`} /></div></label>)}
      </article>
      <article className="panel profit-result"><div className="eyebrow">ESTIMATED UNIT ECONOMICS</div><h2>{profitPerUnit === null ? "—" : currency(profitPerUnit)}</h2><p>Estimated profit per unit at the observed price. Enter every cost to see a result; unspecified costs are not assumed to be zero.</p><div className="profit-divider" /><div className="profit-stat"><span>Estimated margin</span><strong>{margin === null ? "—" : `${margin.toFixed(1)}%`}</strong></div><div className="profit-stat"><span>Estimated monthly profit</span><strong>{monthlyProfit ? `${currency(monthlyProfit[0])}–${currency(monthlyProfit[1])}` : "—"}</strong></div><small>Based on the uncertain estimated sales range; not a profit forecast.</small></article>
    </section>
  </>;

  const renderMethodology = () => <>
    <section className="page-heading"><div><div className="eyebrow">TRANSPARENCY FIRST</div><h1>Methodology & data</h1><p>What Product360 observed, calculated, and estimated.</p></div></section>
    <section className="method-grid">
      <MethodCard title="Observed data" tag="FROM THE VISIBLE PAGE" text="Product title, price, MRP, rating, rating/review counts, images, review excerpts, and competitor cards are read from structured metadata and the page you opened. Missing fields stay unavailable." />
      <MethodCard title="Derived metrics" tag="CALCULATED LOCALLY" text="Discount, competitor relevance, demand, competition, opportunity, sentiment themes, and price position are calculated on this device using explicit rules." />
      <MethodCard title="Estimated metrics" tag="NOT MARKETPLACE FACTS" text="Monthly unit and revenue ranges are directional model outputs based on observed rating/review activity, visible competitors, history, and confidence. Flipkart does not confirm these sales." />
    </section>
    <section className="panel methodology-panel"><div className="panel-heading"><h2>Signals used in this report</h2><span className="confidence-pill">{scores.confidence}% confidence</span></div>
      <ul className="method-list">{[
        ["Product price", product.currentPrice !== null], ["Rating activity", product.ratingCount !== null || product.reviewCount !== null],
        ["Visible relevant competitor listings", product.competitors.length > 0], ["Historical snapshots", history.length > 1],
        ["Accessible review text", product.reviews.length > 0], ["Verified units sold", false],
      ].map(([label, present]) => <li key={String(label)}><span className={present ? "method-check" : "method-unavailable"}>{present ? "✓" : "—"}</span><span>{label}</span><strong>{present ? "Included" : "Unavailable"}</strong></li>)}</ul>
      <div className="notice-box">Confidence reflects data completeness, not the probability that a sales estimate is correct. Estimated revenue is gross marketplace revenue (price × estimated units), not seller profit.</div>
    </section>
    <section className="panel"><div className="panel-heading"><h2>Extraction diagnostics</h2><label className="debug-toggle"><input type="checkbox" checked={debug} onChange={(event) => { const next = event.target.checked; setDebug(next); void setPreference("debugMode", String(next)); }} /> Developer mode</label></div>
      <div className="diagnostics">{Object.entries(product.fields).map(([name, value]) => <div key={name}><span>{name}</span><strong className={value.value === null ? "diag-warning" : "diag-pass"}>{value.value === null ? "Unavailable" : "PASS"}</strong><small>{value.source ?? "not detected"} · {value.confidence} confidence</small></div>)}</div>
      {debug && <pre className="debug-output">{JSON.stringify({ product, scores, history }, null, 2)}</pre>}
    </section>
  </>;

  const content: Record<Section, () => React.ReactNode> = {
    Overview: renderOverview, Competition: renderCompetition, Reviews: renderReviews,
    Demand: renderDemand, History: renderHistory, Profit: renderProfit, Methodology: renderMethodology,
  };
  return <div className="app-layout">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><BarChart3 size={19} /></span><span><strong>Product360</strong><small>SELLER RESEARCH</small></span></a>
      <div className="sidebar-label">WORKSPACE</div>
      <nav aria-label="Report sections">{navigation.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${section === name ? "active" : ""}`} onClick={() => setSection(name)}><Icon size={17} /><span>{name}</span>{name === "Overview" && section === name ? <i /> : null}</button>)}</nav>
      <div className="sidebar-bottom"><span className="privacy-icon"><ShieldCheck size={16} /></span><div><strong>Private by default</strong><span>Data stays on this device</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><span>PRODUCT RESEARCH</span><strong>{section}</strong></div><div className="topbar-right"><span className="local-pill"><span /> LOCAL REPORT</span><time>{new Date(record.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div></header>
      <div className="page-content">{content[section]()}<footer className="page-footer"><ShieldCheck size={14} /> Product360 is an independent research aid. Always verify marketplace data and your own unit economics.</footer></div>
    </main>
  </div>;
}

function SignalRow({ label, value, note }: { label: string; value: number | null; note: string }) {
  return <div className="signal-row"><div><strong>{label}</strong><span>{note}</span></div><div className="signal-meter"><span style={{ width: `${value === null ? 0 : Math.min(100, Math.max(0, value))}%` }} /></div><b>{value === null ? "—" : value}</b></div>;
}

function SnapshotChart({ rows, value, format }: { rows: Snapshot[]; value: (row: Snapshot) => number | null; format: (value: number | null) => string }) {
  const available = rows.map((row) => ({ row, value: value(row) })).filter((entry): entry is { row: Snapshot; value: number } => entry.value !== null);
  if (available.length < 2) return <div className="notice-box">Not enough snapshots contain this metric to draw a trend.</div>;
  const min = Math.min(...available.map((point) => point.value));
  const max = Math.max(...available.map((point) => point.value));
  return <div className="chart"><div className="chart-lines"><i /><i /><i /></div><div className="chart-bars">{available.map(({ row, value: amount }) => <div className="chart-column" key={row.id}><span className="chart-value">{format(amount)}</span><i style={{ height: `${max === min ? 50 : 12 + ((amount - min) / (max - min)) * 75}%` }} /><time>{new Date(row.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></div>)}</div></div>;
}

function MethodCard({ title, tag, text }: { title: string; tag: string; text: string }) {
  return <article className="panel method-card"><span>{tag}</span><h2>{title}</h2><p>{text}</p></article>;
}

createRoot(document.getElementById("root")!).render(<Dashboard />);
