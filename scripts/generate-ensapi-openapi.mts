/**
 * Generates a static OpenAPI 3.1 JSON document for ENSApi.
 *
 * Usage: pnpm generate:openapi
 *
 * Output: docs/ensnode.io/ensapi-openapi.json
 *
 * This script calls generateOpenApi31Document() which uses the real app routes
 * and static metadata. Lazy initialization enables this script to run without config initialization.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import app from "@/app";
import { generateOpenApi31Document } from "@/openapi-document";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "..", "docs", "ensnode.io", "ensapi-openapi.json");

// Generate the document (no additional servers for the static spec)
const document = generateOpenApi31Document(app);

// Write JSON (Biome handles formatting)
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(document));

console.log(`OpenAPI spec written to ${outputPath}`);

// Format with Biome for consistency
console.log("Formatting with Biome...");
try {
  execFileSync("pnpm", ["-w", "exec", "biome", "format", "--write", outputPath], {
    stdio: "inherit",
  });
} catch (error) {
  console.error("Error: Failed to format with Biome.");
  if (error instanceof Error) {
    const err = error as NodeJS.ErrnoException & { status?: number };
    if (err.code === "ENOENT") {
      console.error("'pnpm' is not available on your PATH.");
    } else if (err.status !== undefined) {
      console.error(`Biome exited with code ${err.status}.`);
      console.error(
        `Try running 'pnpm -w exec biome format --write ${outputPath}' manually to debug.`,
      );
    } else if (err.message) {
      console.error(err.message);
    }
  }
  process.exit(1);
}

// Explicitly exit to prevent lazy-initialized SWR caches (imported transitively via app.ts)
// from keeping the process alive with their background timers.
process.exit(0);
