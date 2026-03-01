/**
 * Generates a static OpenAPI 3.1 JSON document for ENSApi.
 *
 * Usage: tsx scripts/generate-openapi.ts
 *
 * Output: <monorepo-root>/docs/docs.ensnode.io/ensapi-openapi.json
 *
 * This script has no runtime dependencies — it calls generateOpenApi31Document()
 * which uses only stub route handlers and static metadata.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generateOpenApi31Document } from "@/openapi-document";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "docs",
  "docs.ensnode.io",
  "ensapi-openapi.json",
);

// Generate the document (no additional servers for the static spec)
const document = generateOpenApi31Document();

// Write JSON (Biome handles formatting)
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(document));

console.log(`OpenAPI spec written to ${outputPath}`);

// Format with Biome for consistency
console.log("Formatting with Biome...");
try {
  execFileSync("pnpm", ["exec", "biome", "format", "--write", outputPath], {
    stdio: "inherit",
  });
} catch (error) {
  console.error("Error: Failed to format with Biome.");
  if (error instanceof Error) {
    const err = error as NodeJS.ErrnoException & { status?: number };
    if (err.code === "ENOENT") {
      console.error("'pnpm' or 'biome' is not available on your PATH.");
    } else if (err.status !== undefined) {
      console.error(`Biome exited with code ${err.status}.`);
      console.error("Try running 'pnpm biome format --write' manually to debug.");
    } else if (err.message) {
      console.error(err.message);
    }
  }
  process.exit(1);
}
