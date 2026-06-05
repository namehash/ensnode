import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OMNIGRAPH_EXAMPLES_CONFIG } from "../src/data/omnigraph-examples/config.ts";
import type { SnapshotExample } from "../src/data/omnigraph-examples/types.ts";
import { getDocsOmnigraphNamespaceConfig } from "../src/lib/examples/omnigraph/constants.ts";

function logStep(message: string, id?: string) {
  console.log(`[omnigraph-examples] ${message} ${id ? `for '${id}'` : ""}`);
}

function logWarn(message: string, id?: string) {
  console.warn(`[omnigraph-examples] WARN: ${message} ${id ? `for example '${id}'` : ""}`);
}

function logError(message: string, id?: string) {
  console.error(`[omnigraph-examples] ERROR: ${message} ${id ? `for example '${id}'` : ""}`);
}

const TIMEOUT_MS = 120_000;
const WARN_THRESHOLD_MS = 5_000;

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "../src/data/omnigraph-examples");
const examplesPath = join(dataDir, "examples.json");
const outputPath = join(dataDir, "responses.json");

if (!existsSync(examplesPath)) {
  logError(`No examples snapshot at ${examplesPath}. Run pnpm omnigraph:snapshot <version> first.`);
  process.exit(1);
}

const snapshotById = new Map(
  (JSON.parse(readFileSync(examplesPath, "utf8")) as SnapshotExample[]).map((e) => [e.id, e]),
);

// Only fetch responses for the rendered set: config entries supported by the vendored snapshot.
const allExampleIds = (Object.keys(OMNIGRAPH_EXAMPLES_CONFIG) as string[])
  .filter((id) => snapshotById.has(id))
  .sort();

// Optional filter: `pnpm omnigraph-examples:refresh-responses <id>,<id>`
const argIds =
  process.argv[2]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

if (argIds.length > 0) {
  const unknown = argIds.filter((id) => !allExampleIds.includes(id));
  if (unknown.length > 0) {
    logError(`Unknown example ID(s): ${unknown.join(", ")}. Known: ${allExampleIds.join(", ")}`);
    process.exit(1);
  }
}

const exampleIds = argIds.length > 0 ? argIds : allExampleIds;

logStep(
  argIds.length > 0
    ? `Refreshing ${exampleIds.length} of ${allExampleIds.length} examples: ${exampleIds.join(", ")}`
    : `Fetching all ${exampleIds.length} Omnigraph examples (per-example namespace endpoints)`,
);

// When refreshing a subset, load the existing responses so unaffected entries are preserved.
const out: Record<string, unknown> =
  argIds.length > 0 && existsSync(outputPath)
    ? (JSON.parse(readFileSync(outputPath, "utf8")) as Record<string, unknown>)
    : {};

for (const id of exampleIds) {
  logStep("Getting example query", id);

  const example = snapshotById.get(id)!;
  const config = OMNIGRAPH_EXAMPLES_CONFIG[id];
  if (!config) {
    logError(`No OMNIGRAPH_EXAMPLES_CONFIG entry for id`, id);
    process.exit(1);
  }

  const endpointOverride = process.env.OMNIGRAPH_ENDPOINT;
  const baseUrl = endpointOverride ?? getDocsOmnigraphNamespaceConfig(config.namespace).ensnodeUrl;
  const url = new URL("/api/omnigraph", baseUrl).toString();

  const query = example.query.trim();
  const variables = example.variables;

  logStep(`POST ${url}`, id);

  const started = performance.now();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text();
    logError(`HTTP ${response.status}. Body (first 800 chars):\n${text.slice(0, 800)}`, id);
    process.exit(1);
  }

  const body = (await response.json()) as Record<string, unknown>;
  const durationMs = Math.round(performance.now() - started);

  if ("errors" in body && Array.isArray(body.errors) && body.errors.length > 0) {
    logError(`GraphQL errors: ${JSON.stringify(body, null, 2)}`, id);
    process.exit(1);
  }

  if (durationMs > WARN_THRESHOLD_MS) {
    logWarn(
      `Took ${durationMs}ms (threshold ${WARN_THRESHOLD_MS}ms). Omnigraph examples should stay fast. Consider changing input variables or simplifying the example query.`,
      id,
    );
  }

  out[id] = body;
  logStep(`Success in ${durationMs}ms`, id);
}

logStep(`Writing responses to ${outputPath}`);
writeFileSync(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
logStep("Done.");
