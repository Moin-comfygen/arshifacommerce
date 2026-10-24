import { describe, expect, it } from "vitest";
import { extractFlipkartProduct, extractProductId, getPageType, isFlipkartUrl, parseCount, parseIndianNumber, parsePrice } from "./extract";
import fixture from "./fixtures/product.html?raw";

describe("Flipkart extraction helpers", () => {
  it.each([
    ["₹1,299", 1299],
    ["₹12,999", 12999],
    ["1.2K", 1200],
    ["1.5L", 150000],
    ["12,345", 12345],
    ["not a number", null],
  ])("parses Indian numeric value %s", (input, expected) => {
    expect(parseIndianNumber(input)).toBe(expected);
  });

  it("parses rupee prices and compact review counts", () => {
    expect(parsePrice("₹12,999")).toBe(12999);
    expect(parseCount("1.2K ratings")).toBe(1200);
    expect(parseCount("1.5L reviews")).toBe(150000);
  });

  it("validates product URLs without accepting unrelated hosts", () => {
    const url = "https://www.flipkart.com/item-name/p/itm1234567890";
    expect(isFlipkartUrl(url)).toBe(true);
    expect(isFlipkartUrl("https://flipkart.com/item-name/p/itm1234567890")).toBe(true);
    expect(isFlipkartUrl("https://flipkart.com.attacker.invalid/item/p/itm1234567890")).toBe(false);
    expect(extractProductId(url)).toBe("ITM1234567890");
    expect(getPageType(url)).toBe("product");
    expect(getPageType("https://www.flipkart.com/search?q=headphones")).toBe("search");
    expect(getPageType("https://example.com/item")).toBe("unsupported");
  });

  it("extracts structured product data and relevant visible competitors", () => {
    document.documentElement.innerHTML = fixture;
    const product = extractFlipkartProduct();
    expect(product.title).toBe("Wireless Bluetooth Headphones");
    expect(product.currentPrice).toBe(1299);
    expect(product.rating).toBe(4.2);
    expect(product.ratingCount).toBe(1234);
    expect(product.reviewCount).toBe(98);
    expect(product.productId).toBe("ITM1234567890");
    expect(product.competitors).toHaveLength(1);
    expect(product.competitors[0].title).toContain("Wireless Bluetooth Headphones");
    expect(product.competitors[0].relevance).toBeGreaterThan(50);
    expect(product.ratingDistribution[5]).toBe(250);
    expect(product.fields.competitors.value).toBe(1);
  });

  it("handles a changed layout and missing page fields without inventing values", () => {
    document.documentElement.innerHTML = "<head><title>Fallback product</title></head><body><h1>Fallback title</h1><div data-testid='price'>₹12,999</div></body>";
    const product = extractFlipkartProduct();
    expect(product.title).toBe("Fallback title");
    expect(product.currentPrice).toBe(12999);
    expect(product.rating).toBeNull();
    expect(product.ratingCount).toBeNull();
    expect(product.competitors).toEqual([]);
  });

  it("deduplicates repeated cards for the same product", () => {
    document.documentElement.innerHTML = fixture.replace(
      "</main>",
      '<article><a href="https://www.flipkart.com/another/p/itm0987654321"><span>Wireless Bluetooth Headphones Pro</span></a><span>₹1,499</span></article></main>',
    );
    expect(extractFlipkartProduct().competitors).toHaveLength(1);
  });
});
