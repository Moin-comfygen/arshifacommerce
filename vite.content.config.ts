import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/content.ts",
      name: "Product360Content",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
