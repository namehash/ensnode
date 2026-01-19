#!/usr/bin/env tsx

/**
 * Generate OpenAPI spec from a running ENSApi instance.
 *
 * Usage:
 *   pnpm openapi:generate                           # Uses default URL (production)
 *   pnpm openapi:generate http://localhost:3223     # Uses custom URL
 *   ENSAPI_URL=http://localhost:3223 pnpm openapi:generate
 *
 * Output:
 *   Writes openapi.json to the docs directory for Mintlify to consume.
 *   Run `pnpm biome format --write docs/docs.ensnode.io/openapi.json` after to format.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_ENSAPI_URL = "https://api.alpha.ensnode.io";
const OUTPUT_PATH = resolve(import.meta.dirname, "../../../docs/docs.ensnode.io/openapi.json");

async function main() {
  // Get URL from argument or environment variable
  const ensapiUrl = process.argv[2] || process.env.ENSAPI_URL || DEFAULT_ENSAPI_URL;
  const openapiUrl = `${ensapiUrl}/openapi.json`;

  console.log(`Fetching OpenAPI spec from: ${openapiUrl}`);

  const response = await fetch(openapiUrl);

  if (!response.ok) {
    console.error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const spec = await response.json();

  // Pretty-print the JSON for readability in git diffs
  const content = `${JSON.stringify(spec, null, 2)}\n`;

  writeFileSync(OUTPUT_PATH, content, "utf-8");

  console.log(`OpenAPI spec written to: ${OUTPUT_PATH}`);
  console.log(`Spec version: ${spec.info?.version}`);
  console.log(`Paths: ${Object.keys(spec.paths || {}).length}`);
}

main().catch((error) => {
  console.error("Error generating OpenAPI spec:", error);
  process.exit(1);
});
