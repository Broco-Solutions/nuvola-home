import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { sourceProducts } from "./catalog-source.mjs";

const publicRoot = new URL("../public/", import.meta.url);

const convertToWebp = (buffer, outputPath) =>
  new Promise((resolve, reject) => {
    const child = spawn("convert", [
      "-",
      "-resize",
      "1800x1800>",
      "-strip",
      "-quality",
      "82",
      `webp:${outputPath}`,
    ]);

    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ImageMagick exited ${code}`))));
    child.stdin.end(buffer);
  });

for (const item of sourceProducts) {
  const directory = new URL(`products/${item.slug}/`, publicRoot);
  await mkdir(directory, { recursive: true });

  for (const [index, sourceUrl] of item.imageSourceUrls.entries()) {
    const optimizedSource = `${sourceUrl}&width=1800`;
    const response = await fetch(optimizedSource);
    if (!response.ok) throw new Error(`${response.status} fetching ${sourceUrl}`);

    const output = new URL(`${String(index + 1).padStart(2, "0")}.webp`, directory);
    await convertToWebp(Buffer.from(await response.arrayBuffer()), output.pathname);
    process.stdout.write(`saved ${item.slug}/${output.pathname.split("/").at(-1)}\n`);
  }
}
