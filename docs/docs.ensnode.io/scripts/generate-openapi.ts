#!/usr/bin/env tsx

/**
 * Generate OpenAPI spec from a running ENSApi instance.
 *
 * Usage:
 *   pnpm openapi:generate http://localhost:3223     # Pass URL as argument
 *   ENSAPI_URL=http://localhost:3223 pnpm openapi:generate  # Or via environment variable
 *
 * Output:
 *   Writes openapi.json to the docs directory for Mintlify to consume. Note that a rebuild of Mintlify is required for it to reflect an updated openapi.json.
 *   Run `pnpm biome format --write docs/docs.ensnode.io/openapi.json` after to format.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve(import.meta.dirname, "../openapi.json");
const TIMEOUT_MS = 30000;

async function main() {
  // Get URL from argument or environment variable (required)
  const ensapiUrl = process.argv[2] || process.env.ENSAPI_URL;

  if (!ensapiUrl) {
    console.error("Error: ENSApi URL is required.");
    console.error("Usage: pnpm openapi:generate <url>");
    console.error("   or: ENSAPI_URL=<url> pnpm openapi:generate");
    console.error("Example: pnpm openapi:generate http://localhost:3223");
    process.exit(1);
  }

  const openapiUrl = `${ensapiUrl}/openapi.json`;

  console.log(`Fetching OpenAPI spec from: ${openapiUrl}`);

  let response: Response;
  try {
    response = await fetch(openapiUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError") {
        console.error(`Error: Request timed out after ${TIMEOUT_MS / 1000} seconds.`);
        console.error("The server may be slow to respond or unreachable.");
      } else if (error.cause && (error.cause as NodeJS.ErrnoException).code === "ECONNREFUSED") {
        console.error(`Error: Connection refused to ${ensapiUrl}`);
        console.error("Make sure the ENSApi server is running and accessible.");
      } else {
        console.error(`Error: Failed to connect to ${ensapiUrl}`);
        console.error(error.message);
      }
    }
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`Error: Server returned ${response.status} ${response.statusText}`);
    if (response.status === 404) {
      console.error("The /openapi.json endpoint was not found. Is this an ENSApi server?");
    }
    process.exit(1);
  }

  let spec: unknown;
  try {
    spec = await response.json();
  } catch {
    console.error("Error: Response is not valid JSON.");
    console.error("The server may not be returning an OpenAPI spec.");
    process.exit(1);
  }

  if (typeof spec !== "object" || spec === null || !("info" in spec) || !("paths" in spec)) {
    console.error("Error: Response does not appear to be a valid OpenAPI spec.");
    console.error("Expected an object with 'info' and 'paths' properties.");
    process.exit(1);
  }

  const typedSpec = spec as {
    info?: { version?: string };
    paths?: Record<string, unknown>;
  };

  // Pretty-print the JSON for readability in git diffs
  const content = `${JSON.stringify(spec, null, 2)}\n`;

  writeFileSync(OUTPUT_PATH, content, "utf-8");

  console.log(`OpenAPI spec written to: ${OUTPUT_PATH}`);
  console.log(`Spec version: ${typedSpec.info?.version}`);
  console.log(`Paths: ${Object.keys(typedSpec.paths || {}).length}`);
}

main();
