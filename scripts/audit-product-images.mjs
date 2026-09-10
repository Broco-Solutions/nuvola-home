import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { sourceProducts } from "./catalog-source.mjs";

const primaryPaths = sourceProducts.map((item) => item.localAssetPaths[0]);
const duplicatePrimaryPaths = primaryPaths.filter((path, index) => primaryPaths.indexOf(path) !== index);
if (sourceProducts.length !== 24) throw new Error(`Expected 24 products, found ${sourceProducts.length}`);
if (duplicatePrimaryPaths.length) throw new Error(`Duplicate primary paths: ${duplicatePrimaryPaths.join(", ")}`);

const hashes = new Map();
let totalBytes = 0;
for (const item of sourceProducts) {
  for (const assetPath of item.localAssetPaths) {
    const diskPath = new URL(`../public${assetPath}`, import.meta.url);
    const [buffer, info] = await Promise.all([readFile(diskPath), stat(diskPath)]);
    totalBytes += info.size;
    const hash = createHash("sha256").update(buffer).digest("hex");
    hashes.set(hash, [...(hashes.get(hash) ?? []), assetPath]);
  }
}

const duplicateFiles = [...hashes.values()].filter((paths) => paths.length > 1);
const primaryHashes = new Set(
  await Promise.all(
    primaryPaths.map(async (assetPath) =>
      createHash("sha256")
        .update(await readFile(new URL(`../public${assetPath}`, import.meta.url)))
        .digest("hex"),
    ),
  ),
);

if (primaryHashes.size !== sourceProducts.length) {
  throw new Error(`Primary image hashes are not unique: ${primaryHashes.size}/${sourceProducts.length}`);
}

console.log(`Products: ${sourceProducts.length}`);
console.log(`Assets: ${sourceProducts.flatMap((item) => item.localAssetPaths).length}`);
console.log(`Primary paths: ${new Set(primaryPaths).size}/${sourceProducts.length} unique`);
console.log(`Primary hashes: ${primaryHashes.size}/${sourceProducts.length} unique`);
console.log(`Duplicate files across all galleries: ${duplicateFiles.length}`);
for (const paths of duplicateFiles) console.log(`  ${paths.join(" = ")}`);
console.log(`Optimized asset weight: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
