# Product360 Research decisions

- **Local-first MV3 extension:** No backend or paid product-research API is required. Analysis is performed in the browser and persisted in extension-origin IndexedDB.
- **Visible-page collection only:** The content script inspects only the user-opened Flipkart page. There is no CAPTCHA evasion, hidden API use, automated broad crawling, or rate-limit circumvention.
- **Conservative competitor discovery:** Relevant cards already visible in the current DOM are compared. Missing competitor data remains unavailable instead of triggering bulk searches.
- **Explicit estimates:** Sales and revenue are ranges labeled as model estimates. They are never described as confirmed units sold or profit.
- **Storage retention:** Product analyses and audit records are capped at 500 records per store; snapshots for the same product are deduplicated within 30 minutes.
- **Accessible layouts:** The report uses responsive cards, tables, and simple local-history bars without a charting dependency.
