# Manual acceptance checklist

## Install

1. Run `npm install` and `npm run build`.
2. In Chrome, open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**.
3. Choose this project's `dist` folder.
4. Open a Flipkart product detail page and refresh it once if it was already open during extension installation.

## Product research scenarios

1. On a normal in-stock item with price and rating, open Product360 and confirm product detection, title, image, price, and rating.
2. Choose **Analyze product** and confirm the report opens with the same product ID and observed values.
3. Check the Methodology view: present fields should have a detected source; unavailable fields should remain unavailable.
4. Confirm monthly sales and revenue are ranges labeled as estimates, and confidence is shown separately.
5. Review the Competition page. Every row should correspond to a relevant listing visible in the analyzed page; use Analyze and Open separately.
6. Review Reviews. Verify accessible-sample count, and ensure no themes are claimed when the sample is too small.
7. Enter all six per-unit costs on Profit, including explicit zeroes for costs that do not apply; verify profit stays blank until all costs are provided.
8. Enable Developer mode and inspect field-level extraction diagnostics; disable it again.
9. Analyze the same product twice within 30 minutes. The analysis should be saved both times while the snapshot count remains deduplicated.
10. Open the latest report after refreshing Chrome; the prior report should still be available.

## Edge cases

- Test a product with missing rating/review text and verify unavailable values are not invented.
- Test an out-of-stock page and verify availability is shown as unavailable.
- Paste a non-Flipkart URL and a Flipkart non-product URL; both should be rejected with an actionable message.
- Test a long product title, missing image, compact counts such as `1.2K`, and large rupee amounts.
- Confirm competitor search activity is never triggered automatically and no bulk network activity occurs.

## Report a mismatch

Record the product URL, field name, visible marketplace value, Product360 value, and approximate test time. Do not include passwords, payment data, or unrelated account information.
