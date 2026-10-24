import { extractFlipkartProduct, getPageType } from "./marketplaces/flipkart/extract";

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    const product = extractFlipkartProduct();
    sendResponse({
      supported: getPageType(location.href) !== "unsupported",
      pageType: getPageType(location.href),
      title: product.title,
      price: product.currentPrice === null ? null : `₹${product.currentPrice.toLocaleString("en-IN")}`,
      rating: product.rating === null ? null : product.rating.toFixed(1),
      image: product.image,
    });
    return false;
  }
  if (message.type === "EXTRACT_PRODUCT") {
    sendResponse({ ok: true, product: extractFlipkartProduct(), pageType: getPageType(location.href) });
    return false;
  }
  return false;
});
