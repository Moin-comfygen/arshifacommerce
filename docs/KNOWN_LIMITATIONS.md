# Known limitations

- Flipkart changes page markup over time. Selectors are kept in the Flipkart adapter and are supplemented by JSON-LD and semantic fallbacks, but live pages still require manual regression checks.
- Rating distribution is extracted only when the page exposes an accessible text representation; otherwise it remains unavailable.
- Review snippets are limited to text currently present in the DOM. Product360 does not paginate or fetch review pages in the background, and review-theme results require at least three accessible snippets.
- Competitors are collected from visible product cards on the analyzed page. A product detail page may not expose enough related listings for a meaningful comparison.
- Sales estimates use rating/review activity as a proxy and are not validated against actual orders. Their scaling constant is provisional, not empirically calibrated. The confidence percentage describes data completeness, not probability of accuracy.
- Review sentiment and themes use a small local phrase lexicon; they are not a substitute for full semantic review analysis and can miss negation, sarcasm, and context.
- Search visibility, seller saturation, category benchmarks, profit inputs, and hidden marketplace metrics are not guessed.
- Live Flipkart browser acceptance, accessibility tooling, and packaged Chrome installation remain to be completed by the product owner.
