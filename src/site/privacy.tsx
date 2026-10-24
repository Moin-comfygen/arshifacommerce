import { createRoot } from "react-dom/client";
import "./site.css";

function PrivacyPage() {
  return <main className="policy-page">
    <a className="policy-back" href="/">← Product360 Research</a>
    <p className="eyebrow">PRIVACY, IN PLAIN LANGUAGE</p>
    <h1>Your research stays yours.</h1>
    <p className="policy-intro">Product360 Research is a local-first Chrome extension for researching Flipkart products.</p>
    <p className="policy-date">Last updated 24 October 2026</p>

    <section>
      <h2>What the extension reads</h2>
      <p>When you open Product360 on a Flipkart page, it reads product information already visible on that page. This may include the product URL, title, image, price, rating and rating/review counts, accessible review excerpts, and competitor listings already present in the page.</p>
      <p>Product360 does not read passwords, payment details, cookies, or private account information. It does not inspect unrelated websites or browsing history.</p>
    </section>
    <section>
      <h2>How your data is used</h2>
      <p>The page information is processed in your browser to show product details, local comparison and analysis, and clearly labeled estimates. If you choose to analyze a product, the extension saves that report and its history in local browser storage. Optional costs you enter are used in the local profit calculator.</p>
    </section>
    <section>
      <h2>Storage, sharing, and retention</h2>
      <p>Product reports, audit details, and historical snapshots are saved in extension-local IndexedDB. The latest report identifier and your diagnostics preference are saved in Chrome local extension storage. Older records are trimmed to keep a maximum of 500 records per stored collection; repeat snapshots are deduplicated for 30 minutes.</p>
      <p>Product360 does not operate a report server. Reports, product data, and costs you enter are not sent to the Product360 publisher or shared with third parties. Remove the extension in Chrome to remove its local extension data.</p>
    </section>
    <section>
      <h2>Network and marketplace access</h2>
      <p>The extension has access to Flipkart pages so it can read visible page content for the research feature. It does not use hidden/private marketplace APIs, automate bulk product searches, bypass authentication, evade CAPTCHAs, or circumvent rate limits. Chrome and Flipkart may make their own normal network requests when loading their pages.</p>
    </section>
    <section>
      <h2>Permission</h2>
      <p>Chrome local storage saves the extension preference and latest report reference. Flipkart site access enables visible page extraction. Product360 does not request the broad tabs permission.</p>
    </section>
    <section id="contact">
      <h2>Changes and contact</h2>
      <p>This policy will be updated if the extension’s data practices change. Publisher contact details will be added here before a public Chrome Web Store release.</p>
    </section>
    <footer><a href="/">Product360 Research</a><span>Independent research tool; not affiliated with Flipkart.</span></footer>
  </main>;
}

createRoot(document.getElementById("root")!).render(<PrivacyPage />);
