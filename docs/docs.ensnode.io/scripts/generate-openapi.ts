#!/usr/bin/env tsx

/**
 * Generate OpenAPI spec from a running ENSApi instance.
 *
 * Usage:
 *   pnpm openapi:generate http://localhost:4334
 *
 * Output:
 *   Writes openapi.json to the docs directory for Mintlify to consume, then formats it with Biome.
 *   Note that a rebuild of Mintlify is required for it to reflect an updated openapi.json.
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve(import.meta.dirname, "../openapi.json");
const TIMEOUT_MS = 30000;

async function main() {
  const ensapiUrl = process.argv[2];

  if (!ensapiUrl) {
    console.error("Error: ENSApi URL is required.");
    console.error("Usage: pnpm openapi:generate <url>");
    console.error("Example: pnpm openapi:generate http://localhost:4334");
    process.exit(1);
  }

  const normalizedEnsapiUrl = ensapiUrl.replace(/\/+$/, "");
  const openapiUrl = `${normalizedEnsapiUrl}/openapi.json`;

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
  } catch (error) {
    console.error("Error: Response is not valid JSON.");
    if (error instanceof Error) {
      console.error(`Parse error: ${error.message}`);
    }
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

  writeFileSync(OUTPUT_PATH, JSON.stringify(spec), "utf-8");

  console.log(`OpenAPI spec written to: ${OUTPUT_PATH}`);
  console.log(`Spec version: ${typedSpec.info?.version}`);
  console.log(`Paths: ${Object.keys(typedSpec.paths || {}).length}`);

  // Format the output with Biome (required for CI to pass)
  console.log("Formatting with Biome...");
  try {
    execFileSync("pnpm", ["biome", "format", "--write", OUTPUT_PATH], {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Error: Failed to format openapi.json with Biome.");
    if (error instanceof Error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        console.error(
          "It looks like 'pnpm' or 'biome' is not installed or not available on your PATH.",
        );
      } else if (err.message) {
        console.error(err.message);
      }
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
