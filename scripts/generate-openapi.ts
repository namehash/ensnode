/**
 * Generates a static OpenAPI 3.1 JSON document for an app.
 *
 * This script is app-agnostic — it imports `generateOpenApi31Document` from
 * `@/openapi-document`, which resolves to whichever app context the script
 * is executed in (controlled by `--filter <app>` in the calling script).
 *
 * Usage:
 *   pnpm --filter <app> exec tsx --tsconfig tsconfig.json \
 *     ../../scripts/generate-openapi.ts --out <output-path>
 *
 * Example:
 *   pnpm --filter ensapi exec tsx --tsconfig tsconfig.json \
 *     ../../scripts/generate-openapi.ts --out ../../docs/docs.ensnode.io/ensapi-openapi.json
 *
 * The --out path is resolved relative to the app's root directory.
 *
 * This script has no runtime dependencies — it calls generateOpenApi31Document()
 * which uses only stub route handlers and static metadata.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

import { generateOpenApi31Document } from "@/openapi-document";

const { values } = parseArgs({
  options: {
    out: { type: "string" },
  },
  strict: true,
});

if (!values.out) {
  console.error("Error: --out <path> is required.");
  process.exit(1);
}

const outputPath = resolve(values.out);

// Generate the document (no additional servers for the static spec)
const document = generateOpenApi31Document();

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
