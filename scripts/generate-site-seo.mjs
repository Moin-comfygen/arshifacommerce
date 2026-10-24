import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configuredUrl = process.env.PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

if (!configuredUrl) {
  console.warn("PUBLIC_SITE_URL is not set; built the website without a sitemap or canonical host. Set it in Vercel after deployment.");
  process.exit(0);
}

const parsedUrl = new URL(configuredUrl);
if (parsedUrl.protocol !== "https:" || parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
  throw new Error("PUBLIC_SITE_URL must be a canonical HTTPS origin such as https://product360.example.com.");
}
const origin = parsedUrl.origin;
const indexPath = resolve(root, "site-dist", "index.html");
const html = await readFile(indexPath, "utf8");
const searchTags = [
  `<link rel="canonical" href="${origin}/">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:title" content="Product360 Research — Clarity for your next product">`,
  `<meta property="og:description" content="Research Flipkart products with local-first insights and clearly labeled estimates.">`,
  `<meta property="og:url" content="${origin}/">`,
  `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Product360 Research",
    url: `${origin}/`,
    description: "Local-first product research for Indian e-commerce sellers.",
  })}</script>`,
].join("\n    ");
await writeFile(indexPath, html.replace("</head>", `    ${searchTags}\n  </head>`));

const urls = ["", "/privacy", "/install"].map((path) =>
  `<url><loc>${origin}${path || "/"}</loc></url>`,
).join("");
await writeFile(
  resolve(root, "site-dist", "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
);
await writeFile(
  resolve(root, "site-dist", "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
