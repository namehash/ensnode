import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ACTIVE_OMNIGRAPH_VERSION } from "../src/data/omnigraph-examples/active.ts";
import { OMNIGRAPH_EXAMPLES_META } from "../src/data/omnigraph-examples/meta.ts";
import type { SnapshotExample } from "../src/data/omnigraph-examples/types.ts";
import { ENSNODE_URL } from "../src/lib/playground/constants.ts";

function logStep(message: string, id?: string) {
  console.log(`[omnigraph-examples] ${message} ${id ? `for '${id}'` : ""}`);
}

function logError(message: string, id?: string) {
  console.error(`[omnigraph-examples] ERROR: ${message} ${id ? `for example '${id}'` : ""}`);
}

// Target version defaults to the active one; override to fill responses for a staged version.
const version = process.env.OMNIGRAPH_VERSION ?? ACTIVE_OMNIGRAPH_VERSION;
const versionDir = join(
  dirname(fileURLToPath(import.meta.url)),
  `../src/data/omnigraph-examples/versions/${version}`,
);
const examplesPath = join(versionDir, "examples.json");
const outputPath = join(versionDir, "responses.json");

if (!existsSync(examplesPath)) {
  logError(`No examples snapshot at ${examplesPath}. Snapshot version "${version}" first.`);
  process.exit(1);
}

const snapshotById = new Map(
  (JSON.parse(readFileSync(examplesPath, "utf8")) as SnapshotExample[]).map((e) => [e.id, e]),
);

// Only fetch responses for the rendered set: meta entries supported by this version's snapshot.
const allExampleIds = (Object.keys(OMNIGRAPH_EXAMPLES_META) as string[])
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

const base = ENSNODE_URL.replace(/\/+$/, "");
const url = `${base}/api/omnigraph`;

logStep(
  argIds.length > 0
    ? `Refreshing ${exampleIds.length} of ${allExampleIds.length} examples (${version}) from ${url}: ${exampleIds.join(", ")}`
    : `Fetching all ${exampleIds.length} Omnigraph examples (${version}) from ${url}`,
);

// When refreshing a subset, load the existing responses so unaffected entries are preserved.
const out: Record<string, unknown> =
  argIds.length > 0 && existsSync(outputPath)
    ? (JSON.parse(readFileSync(outputPath, "utf8")) as Record<string, unknown>)
    : {};

for (const id of exampleIds) {
  logStep("Getting example query", id);

  const example = snapshotById.get(id)!;
  const query = example.query.trim();
  const variables = example.variables;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const text = await response.text();
    logError(`HTTP ${response.status}. Body (first 800 chars):\n${text.slice(0, 800)}`, id);
    process.exit(1);
  }

  const body = await response.json();

  if (
    typeof body === "object" &&
    body !== null &&
    "errors" in body &&
    Array.isArray((body as { errors: unknown }).errors) &&
    (body as { errors: unknown[] }).errors.length > 0
  ) {
    logError(`GraphQL errors: ${JSON.stringify(body, null, 2)}`, id);
    process.exit(1);
  }

  out[id] = body;
  logStep("Success", id);
}

logStep(`Writing responses to ${outputPath}`);
writeFileSync(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
logStep("Done.");
