import { createRoot } from "react-dom/client";
import {
  ArrowDownRight, ArrowRight, BarChart3, Check, ChevronDown, CircleHelp,
  Database, Eye, Fingerprint, LineChart, LockKeyhole, MessageSquareText,
  PackageSearch, ShieldCheck, Sparkles, Store, TrendingUp,
} from "lucide-react";
import "./site.css";

const features = [
  {
    icon: Eye,
    title: "Start with what’s observable",
    text: "See the product details, price, rating and counts available on the Flipkart page you choose to analyze.",
  },
  {
    icon: Store,
    title: "Compare relevant listings",
    text: "Compare product cards already visible in your page. No broad crawling or invented competitor data.",
  },
  {
    icon: TrendingUp,
    title: "Treat estimates as estimates",
    text: "Review model-based monthly sales and revenue ranges with confidence labels—not made-up exact sales.",
  },
  {
    icon: MessageSquareText,
    title: "Hear the customer signal",
    text: "When review excerpts are available, inspect recurring themes locally. Thin samples stay clearly marked.",
  },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return <a className={`wordmark${light ? " light" : ""}`} href="/" aria-label="Product360 Research home">
    <span className="wordmark-icon"><BarChart3 size={18} strokeWidth={2.3} /></span>
    <span>product<span>360</span></span>
    <i>RESEARCH</i>
  </a>;
}

function LandingPage() {
  return <div className="site-shell">
    <header className="site-header">
      <Wordmark />
      <nav className="main-nav" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#principles">Our approach</a>
        <a href="/privacy">Privacy</a>
      </nav>
      <a className="header-cta" href="/install">Get the preview <ArrowRight size={15} /></a>
    </header>

    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="announcement"><span><Sparkles size={13} /></span> BUILT FOR INDIAN E-COMMERCE SELLERS <ArrowRight size={12} /></div>
          <h1>Find the signal<br />behind the <span>scroll.</span></h1>
          <p className="hero-description">A clearer way to research Flipkart products as you browse. See what’s observable, understand what’s estimated, and make your next move with more context.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/install">Explore the preview <ArrowRight size={16} /></a>
            <a className="text-cta" href="#how-it-works">See how it works <ArrowDownRight size={15} /></a>
          </div>
          <div className="hero-trust"><span><ShieldCheck size={15} /></span> Local-first by design <i /> No paid research API <i /> Estimates, clearly labeled</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a Product360 report">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="report-window">
            <div className="window-top"><div className="window-dots"><i /><i /><i /></div><span>PRODUCT RESEARCH</span><span className="local-tag"><LockKeyhole size={10} /> ON DEVICE</span></div>
            <div className="report-product"><div className="device-image"><PackageSearch size={25} /></div><div><span>FLIPKART PRODUCT</span><strong>Your next product idea</strong><small>Observed details appear here</small></div><span className="report-stars">★ <i>—</i></span></div>
            <div className="report-rule" />
            <div className="report-cards">
              <div><span>DEMAND</span><b>—<i>/100</i></b><small>Needs page data</small></div>
              <div><span>COMPETITION</span><b>—<i>/100</i></b><small>Visible listings</small></div>
              <div className="estimate-card"><span>EST. MONTHLY SALES</span><b>Range, not a fact</b><small>Confidence shown</small></div>
            </div>
            <div className="report-empty"><div><CircleHelp size={15} /></div><p><strong>Evidence before answers.</strong><span>Open a Flipkart product to generate your local report.</span></p></div>
            <div className="report-bottom"><span><i /> OBSERVED DATA</span><span><i /> DERIVED</span><span><i /> ESTIMATED</span></div>
          </div>
          <div className="float-note note-one"><span><LockKeyhole size={14} /></span><div><strong>Your report</strong><small>Stays in your browser</small></div></div>
          <div className="float-note note-two"><span className="note-chart"><LineChart size={16} /></span><div><strong>No fake precision</strong><small>Ranges with context</small></div></div>
          <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✳</div>
        </div>
        <div className="hero-bottom"><span>PRODUCT RESEARCH, WITHOUT THE GUESSWORK</span><a href="#how-it-works">SCROLL TO EXPLORE <ChevronDown size={13} /></a></div>
      </section>

      <section className="principles-strip" id="principles">
        <div><span className="principle-icon"><Eye size={17} /></span><p><strong>Observed</strong><small>What the page shows</small></p></div>
        <span className="principle-plus">+</span>
        <div><span className="principle-icon green"><BarChart3 size={17} /></span><p><strong>Derived</strong><small>What the signals suggest</small></p></div>
        <span className="principle-plus">+</span>
        <div><span className="principle-icon sand"><CircleHelp size={17} /></span><p><strong>Estimated</strong><small>Always labeled, never dressed as fact</small></p></div>
        <p className="principles-note">Three kinds of data.<br /><strong>One more honest picture.</strong></p>
      </section>

      <section className="features-section" id="how-it-works">
        <div className="section-intro"><div><span className="section-kicker">A BETTER RESEARCH ROUTINE</span><h2>Less tab-hopping.<br /><span>More useful context.</span></h2></div><p>Product360 brings the signals together around the product page you’re already looking at—then gives you room to judge for yourself.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text }, index) =>
          <article className="feature-card" key={title}><span className="feature-number">0{index + 1}</span><div className="feature-icon"><Icon size={20} strokeWidth={1.8} /></div><h3>{title}</h3><p>{text}</p><span className="feature-arrow"><ArrowRight size={15} /></span></article>
        )}</div>
      </section>

      <section className="method-section">
        <div className="method-copy"><span className="section-kicker">A DECISION AID, NOT A CRYSTAL BALL</span><h2>Know what’s a signal.<br /><span>Know what isn’t.</span></h2><p>Marketplace activity can offer useful clues, but it can’t reveal exact competitor orders. Product360 keeps that distinction visible—so a score supports your judgement instead of pretending to replace it.</p><a href="/privacy" className="method-link">Read our privacy approach <ArrowRight size={14} /></a></div>
        <div className="method-visual">
          <div className="method-stamp"><Fingerprint size={21} /><span>LOCAL BY<br />DEFAULT</span></div>
          <div className="method-row"><span className="method-check"><Check size={13} /></span><div><strong>Observed on the page</strong><small>Price, rating, visible listings</small></div><span className="method-kind">OBSERVED</span></div>
          <div className="method-row"><span className="method-check derived"><BarChart3 size={13} /></span><div><strong>Calculated on device</strong><small>Comparisons and score breakdowns</small></div><span className="method-kind derived-text">DERIVED</span></div>
          <div className="method-row"><span className="method-check estimated"><CircleHelp size={13} /></span><div><strong>Estimated, not verified</strong><small>Ranges show uncertainty</small></div><span className="method-kind estimated-text">ESTIMATED</span></div>
          <div className="method-foot"><Database size={14} /><span>Product research stays in your browser</span><LockKeyhole size={13} /></div>
        </div>
      </section>

      <section className="install-cta">
        <div className="cta-star">✳</div><span className="section-kicker">YOUR NEXT IDEA STARTS WITH A CLOSER LOOK</span>
        <h2>Bring a little more clarity<br />to your next product decision.</h2>
        <p>Explore the Product360 Research preview for Chrome. Live analysis runs locally on the Flipkart page you choose.</p>
        <a className="button button-dark" href="/install">See preview install steps <ArrowRight size={16} /></a>
        <small>Chrome extension preview · No public Chrome Web Store listing yet</small>
      </section>
    </main>

    <footer className="site-footer">
      <Wordmark light />
      <p>Independent seller research. Unaffiliated with Flipkart.</p>
      <div><a href="/privacy">Privacy</a><a href="/install">Install preview</a><a href="/privacy#contact">Contact</a></div>
      <small>© 2026 Product360 Research</small>
    </footer>
  </div>;
}

createRoot(document.getElementById("root")!).render(<LandingPage />);
