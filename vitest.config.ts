import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "https://www.flipkart.com/wireless-headphones/p/itm1234567890" },
    },
    clearMocks: true,
  },
});
