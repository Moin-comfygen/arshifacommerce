# Chrome Web Store listing draft

Use these values in the Chrome Web Store Developer Dashboard. The publisher must verify that the feature description and data-use declarations match the final submitted package.

## Item details

- **Name:** Product360 Research
- **Category:** Shopping
- **Language:** English
- **Short description (manifest, max 132 characters):** Local Flipkart product research with competitor comparisons and clearly labeled sales estimates.
- **Single purpose:** Product360 helps a seller research a Flipkart product by reading the visible product page and showing local product, competitor, review, and demand insights.

## Detailed description

Research Flipkart products while you browse. Product360 turns information visible on the product page into a clear, local-first seller research report.

**What you can review**

- Product title, price, MRP/discount, rating, and available rating/review counts.
- Relevant competitor listings already visible in the page you opened.
- Demand, competition, opportunity, confidence, and a SELL / TEST / AVOID decision.
- A monthly sales and revenue *estimate range* when enough activity data is available.
- Accessible review excerpts and recurring themes, when there is a sufficient sample.
- Local snapshots, a seller-entered cost calculator, and extraction diagnostics.

**Honest estimates. Private by default.**

Sales estimates are model estimates—not verified Flipkart orders. Revenue is not seller profit. Scores depend on visible page data and can be incomplete when information is unavailable. Product360 processes reports in your browser and stores them locally; it does not send report data to a Product360 server.

Product360 Research is an independent tool and is not affiliated with or endorsed by Flipkart.

## Permission justifications

- **`storage`:** Persist the user's analyzed reports, history, and developer-mode preference locally in the extension.
- **Flipkart site access:** Read visible product-page content on Flipkart to provide the product research feature. No CAPTCHA bypass, hidden/private endpoint, login-data, or bulk crawling is used.
- **Remote code:** No. The extension's JavaScript is bundled in the submitted package; it does not download or execute remote code.

The manifest intentionally does not request the broad `tabs` permission. The extension uses the tabs API only to identify the active tab and open the report or a user-selected listing.

## Privacy/data-use questionnaire notes

The extension handles **website content** from the user's active Flipkart page, including the product URL and visible product fields/review excerpts, and stores the resulting report locally. Google's policy says data handling must be disclosed even when processing and storage remain on-device. In the dashboard, answer the data categories and Limited Use certification truthfully based on the final code and current Google form; do not claim that the extension handles no data. No report data is transmitted to an extension backend or shared with third parties.

## Required listing assets and release status

- Store icon: generated 128×128 PNG is in `dist/icons/icon128.png`.
- Screenshot: **still required**. Capture at least one genuine 1280×800 screenshot of the running extension/dashboard with the user's own Chrome after acceptance testing. Do not use fabricated or fixture product data in a public listing screenshot.
- Public privacy-policy URL: when the Vercel landing site is deployed, use its `/privacy` page as the policy URL.
- Support URL: optional; use a publisher-controlled contact or support page if available.
- Publishing: not submitted. The publisher must review screenshots, privacy declarations, country/distribution settings, and the final Chrome submission confirmation.

## Public listing URL and Google Search

The Chrome Web Store assigns the extension's permanent ID when the publisher creates the item. After it is publicly published, copy the exact listing URL from the dashboard's **View in Chrome Web Store** action. It will use the `chromewebstore.google.com/detail/.../<extension-id>` form.

There is no public listing URL before the item is created and published. Google Search indexing is separate and not guaranteed or immediate. After publication, try searching the exact title `Product360 Research` or `site:chromewebstore.google.com "Product360 Research"`; share the direct Store listing URL while it is not yet appearing in search.
