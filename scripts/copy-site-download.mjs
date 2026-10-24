import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const downloadDirectory = resolve(root, "site-public", "download");
await mkdir(downloadDirectory, { recursive: true });
await copyFile(
  resolve(root, "Product360-Research-0.1.0.zip"),
  resolve(downloadDirectory, "Product360-Research-0.1.0.zip"),
);
