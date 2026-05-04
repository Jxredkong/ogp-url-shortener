import { cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = dirname(__dirname);

const pairs = [["src/db/migrations", "dist/db/migrations"]];

for (const [from, to] of pairs) {
  await cp(join(root, from), join(root, to), { recursive: true });
  console.log(`[copy-assets] ${from} -> ${to}`);
}
