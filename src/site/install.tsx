import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, BarChart3, Chrome, Download, ShieldCheck } from "lucide-react";
import "./site.css";

function InstallPage() {
  return <div className="install-page">
    <header className="site-header"><a href="/" className="wordmark"><span className="wordmark-icon"><BarChart3 size={18} /></span><span>product<span>360</span></span><i>RESEARCH</i></a><a className="back-link" href="/"><ArrowLeft size={14} /> Back to overview</a></header>
    <main className="install-content">
      <span className="section-kicker">PRODUCT360 RESEARCH · CHROME PREVIEW</span>
      <h1>Try the preview<br /><span>in your own Chrome.</span></h1>
      <p className="install-lede">This early-access build is installed manually. It’s not listed in the Chrome Web Store yet.</p>
      <a className="button button-primary download-button" href="/download/Product360-Research-0.1.0.zip" download><Download size={17} /> Download Product360 preview <ArrowRight size={15} /></a>
      <div className="install-warning"><ShieldCheck size={17} /><p><strong>Know what you’re installing.</strong><span>The extension reads visible content on Flipkart pages when you open the Product360 popup. Reports are stored in your browser. Review the <a href="/privacy">privacy policy</a> before installing.</span></p></div>
      <section className="install-steps">
        <h2><Chrome size={18} /> Install in Chrome</h2>
        <ol>
          <li><span>1</span><p>Download the ZIP above, then extract it to a folder you’ll keep.</p></li>
          <li><span>2</span><p>Open <code>chrome://extensions</code> in Chrome and switch on <strong>Developer mode</strong>.</p></li>
          <li><span>3</span><p>Select <strong>Load unpacked</strong> and choose the extracted folder that contains <code>manifest.json</code>.</p></li>
          <li><span>4</span><p>Open a Flipkart product page, refresh it, open Product360, then choose <strong>Analyze product</strong>.</p></li>
        </ol>
      </section>
      <p className="install-note">If Chrome shows an extension warning, that’s because this preview is not from the Chrome Web Store. Install only if you trust this build. The extension currently has not been reviewed or published by Google.</p>
      <a className="install-home-link" href="/"><ArrowLeft size={14} /> Back to Product360</a>
    </main>
    <footer className="install-footer"><a href="/privacy">Privacy policy</a><span>Product360 Research is independent and unaffiliated with Flipkart.</span></footer>
  </div>;
}

createRoot(document.getElementById("root")!).render(<InstallPage />);
