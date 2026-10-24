import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, relative, sep } from "node:path";
import { zipSync } from "fflate";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const output = resolve(root, "Product360-Research-0.1.0.zip");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const manifest = JSON.parse(await readFile(resolve(dist, "manifest.json"), "utf8"));
if (manifest.manifest_version !== 3) throw new Error("Expected a Manifest V3 extension build.");

const files = await listFiles(dist);
const archiveFiles = {};
for (const path of files) {
  const archivePath = relative(dist, path).split(sep).join("/");
  archiveFiles[archivePath] = new Uint8Array(await readFile(path));
}

for (const required of ["manifest.json", "content.js", "background.js", "index.html", "dashboard.html"]) {
  if (!archiveFiles[required]) throw new Error(`Extension archive is missing ${required}.`);
}

await writeFile(output, zipSync(archiveFiles, { level: 9 }));
console.log(`Created ${relative(root, output)} (${files.length} files).`);
