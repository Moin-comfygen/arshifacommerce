import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "website",
  publicDir: resolve(projectRoot, "site-public"),
  plugins: [react()],
  build: {
    outDir: resolve(projectRoot, "site-dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(projectRoot, "website/index.html"),
        privacy: resolve(projectRoot, "website/privacy.html"),
        install: resolve(projectRoot, "website/install.html"),
      },
    },
  },
});
