# Product360 Research

Product360 is a local-first Chrome extension MVP for researching Flipkart products using information already visible in the page you open. Product360 separates observed page data from calculated scores and clearly labels sales/revenue as estimates—not verified Flipkart sales or seller profit.

## Features

- Flipkart product-page detection and structured metadata/DOM extraction.
- Indian rupee, rating, and compact-count parsing.
- Visible-page competitor discovery with title and price relevance ranking.
- Demand, competition, opportunity, confidence, and SELL/TEST/AVOID indicators.
- Estimated monthly sales and gross revenue ranges where observed activity allows an estimate.
- Local review-theme classification when enough review text is accessible.
- Local IndexedDB reports, audit records, and deduplicated product snapshots.
- Overview, Competition, Reviews, Demand, History, Profit, and Methodology screens.
- Local cost-entry profit calculator, score explanations, and optional extraction diagnostics.

## Architecture

- `public/manifest.json`: Manifest V3 permissions and extension entry points.
- `src/content.ts`: page message bridge; built as a self-contained content script.
- `src/marketplaces/flipkart/`: URL detection, parsers, DOM/JSON-LD extraction, and sanitized fixture.
- `src/background.ts`: coordinates explicit analysis requests and opens the report.
- `src/analytics/`: deterministic scoring and local review analysis.
- `src/storage/`: IndexedDB persistence and Chrome-local preferences.
- `src/popup/`: lightweight action popup.
- `src/dashboard/`: full local report and its views.

## Requirements and development

Use Node.js 20 or newer and npm.

```powershell
npm install
npm run typecheck
npm test
npm run lint
npm run build
npm run package
```

The production extension is generated in `dist\`. `npm run package` validates its Manifest V3 references and creates the ready-to-extract `Product360-Research-0.1.0.zip` in the project root.

## Vercel website

The public website is built separately from the extension:

```powershell
npm run build:site
```

This generates the static marketing site, privacy-policy page, installation instructions, and a copy of the extension download under `site-dist\`. Vercel uses [vercel.json](vercel.json) to build and publish it. Import this project in Vercel or run the Vercel CLI, set `PUBLIC_SITE_URL` to the production HTTPS origin, then deploy. Once deployed, use the Vercel Production Domains URL to visit `/`, `/privacy`, and `/install`. The published site can be indexed by Google, but indexing and ranking are controlled by Google and are not instant or guaranteed. Google Search Console can be used to submit the generated `/sitemap.xml`.

## Load the unpacked extension

1. Run `npm install` and `npm run build`.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the project's `dist` directory.
5. Open a Flipkart product page, select Product360 Research, and choose **Analyze product**.

## Scoring and estimates

All scores are deterministic, bounded 0–100, and based on the currently available product, competitor, and local-history signals. Recommendation uses multiple signals; it is not financial advice.

Monthly sales are a conservative model range based on rating/review activity and available local history. The current ratings-to-monthly-sales scaling constant is a provisional heuristic, not empirically calibrated. It is not an order count supplied by Flipkart. The confidence percentage represents input completeness, not statistical probability. Revenue is current observed price multiplied by the estimated unit range; it is not profit. Enter every cost (including zero where applicable) in the Profit screen before using the profit estimate.

## Permissions

The extension requests `storage` and access only to Flipkart pages. It does not request the broad `tabs` permission. See [docs/PRIVACY.md](docs/PRIVACY.md).

## Testing and troubleshooting

Tests use a sanitized offline fixture and local IndexedDB emulator. No test needs to contact Flipkart.

If extraction returns missing values, refresh the product page and retry. You can enable **Developer mode** in Methodology to review which fields were detected and their extraction source. Report mismatches with the product URL, field name, expected visible value, extracted value, and approximate time; do not share account credentials or order details.

## Known limitations and release

See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md). Live-page acceptance and Chrome Web Store publishing are not claimed as complete; no release is published automatically. Before reporting a mismatch, follow [docs/ACCEPTANCE_TESTS.md](docs/ACCEPTANCE_TESTS.md). Version notes are in [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md).
