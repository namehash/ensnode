import type { Address } from "enssdk";
import type { Context } from "hono";
import { isAddress } from "viem";
import { z } from "zod";

import { errorResponse } from "@/lib/error-response";
import {
  classifySubmissions,
  collectLookupHashes,
  hashLabel,
  type LabelClassification,
} from "@/lib/labels";
import { lookupLabels } from "@/lib/omnigraph-client";

/**
 * Mirror of `LABELS_BY_HASHES_MAX` in `apps/ensapi/src/omnigraph-api/schema/label.ts`.
 *
 * The collector pre-caps to the same limit so requests fail fast with a clear 400 instead of
 * trekking to ENSApi only to be rejected.
 *
 * Each submitted label can produce up to 2 hashes (raw + normalized variant), so we accept at
 * most `LABELS_BY_HASHES_MAX / 2` raw labels per request.
 */
export const MAX_LABELS_PER_SUBMISSION = 50;

const SubmissionsRequestSchema = z.object({
  labels: z.array(z.string().min(1).max(1000)).min(1).max(MAX_LABELS_PER_SUBMISSION),
  callerAddress: z
    .string()
    .refine((value) => isAddress(value, { strict: false }), {
      message: "callerAddress must be a valid EVM address",
    })
    .transform((value) => value.toLowerCase() as Address),
});

export type SubmissionsRequest = z.infer<typeof SubmissionsRequestSchema>;

export type SubmissionResultItem = {
  rawLabel: string;
  labelHash: string;
  normalizedLabel?: string;
  normalizedLabelHash?: string;
  status: LabelClassification["status"];
};

export type SubmissionsResponse = {
  submittedAt: string;
  callerAddress: Address;
  results: SubmissionResultItem[];
};

/**
 * Structured submission record written to stdout as a single JSON line per request.
 *
 * Intentionally storage-agnostic: the shape is the future DB row shape so swapping the sink
 * for Postgres + Drizzle later is a mechanical change.
 *
 * TODO(#2003): replace stdout sink with persistent store (Postgres + Drizzle) without changing
 * this log shape.
 *
 * TODO(#2003): drain stored submissions on a schedule and submit them in batches; do not
 * couple to the request lifecycle.
 *
 * TODO(#2003): a downstream aggregator can compute leaderboards by `callerAddress` from these
 * lines (per-status counts are already implicit in `items[].status`).
 */
export type SubmissionLogLine = {
  ts: string;
  requestId: string;
  callerAddress: Address;
  items: SubmissionResultItem[];
};

function toResultItem(c: LabelClassification): SubmissionResultItem {
  const item: SubmissionResultItem = {
    rawLabel: c.rawLabel,
    labelHash: c.labelHash,
    status: c.status,
  };
  if (c.normalizedLabel !== undefined) item.normalizedLabel = c.normalizedLabel;
  if (c.normalizedLabelHash !== undefined) item.normalizedLabelHash = c.normalizedLabelHash;
  return item;
}

function generateRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function submissionsHandler(c: Context) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, { message: "Request body must be valid JSON", status: 400 });
  }

  const parsed = SubmissionsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(c, { error: parsed.error });
  }

  const { labels, callerAddress } = parsed.data;

  const hashed = labels.map(hashLabel);
  const hashes = collectLookupHashes(hashed);

  const hits = await lookupLabels(hashes);
  const classifications = classifySubmissions(hashed, hits);
  const results = classifications.map(toResultItem);

  const submittedAt = new Date().toISOString();
  const requestId = generateRequestId();

  const logLine: SubmissionLogLine = {
    ts: submittedAt,
    requestId,
    callerAddress,
    items: results,
  };
  console.log(JSON.stringify(logLine));

  const response: SubmissionsResponse = {
    submittedAt,
    callerAddress,
    results,
  };
  return c.json(response);
}
