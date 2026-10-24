# Privacy

Product360 Research reads the currently open Flipkart product page when you open the extension popup and request product analysis. It may read the visible product title, prices, rating and review counts, available review excerpts, images, and product cards already present on that page. It processes this content locally and stores reports in the extension's IndexedDB. Preferences are stored in `chrome.storage.local`.

The extension does not operate a backend, transmit report data, collect credentials or payment information, or inspect unrelated browsing history. It does not access cookies, private account data, or hidden marketplace APIs. The content script runs only on Flipkart pages and reads page content that is already visible to the browser.

## Permissions

- `storage`: saves the local debug preference and latest report identifier.
- The extension uses Chrome's tabs API only to identify the active tab after the user opens the popup, open the report, and open a selected competitor listing. It does not request the broad `tabs` permission or inspect unrelated browsing history.
- Flipkart host access: runs the content extractor on Flipkart pages only.

To erase stored research, remove Product360 Research from Chrome; Chrome removes the extension's local storage with it.

For Chrome Web Store review, this policy must be published at a stable public URL under the publisher's control and that URL entered in the dashboard.
