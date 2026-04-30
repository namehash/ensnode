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
  type LabelHit,
} from "@/lib/labels";
import { lookupLabels } from "@/lib/omnigraph-client";

/**
 * Maximum number of raw labels accepted per `POST /api/submissions` request.
 *
 * This is independent of how many labelhashes each label expands into (1 if already
 * normalized / unnormalizable, 2 if it has a distinct normalized form). The resolver
 * cap (`LABELS_BY_HASHES_MAX = 200` in `apps/ensapi/src/omnigraph-api/schema/label.ts`)
 * is sized to exactly accommodate the worst case (2 * `MAX_LABELS_PER_SUBMISSION`).
 * Keep these limits in sync so callers always get the same per-submission limit
 * regardless of normalization.
 */
export const MAX_LABELS_PER_SUBMISSION = 100;

/**
 * Hard upper bound on how long a single `POST /api/submissions` will wait on the
 * Omnigraph labels lookup before failing the request. Prevents a stalled upstream
 * from holding handler resources indefinitely.
 */
export const OMNIGRAPH_LOOKUP_TIMEOUT_MS = 10_000;

const SubmissionsRequestSchema = z.object({
  labels: z.array(z.string().min(1).max(1000)).min(1).max(MAX_LABELS_PER_SUBMISSION),
  callerAddress: z
    .string()
    .refine((value) => isAddress(value, { strict: false }), {
      message: "callerAddress must be a valid EVM address",
    })
    .transform((value) => value.toLowerCase() as Address),
});

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
type SubmissionLogLine = {
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

  let hits: LabelHit[];
  try {
    // `AbortSignal.any` aborts when either the timeout fires or the client disconnects, so
    // the upstream HTTP request is cancelled in both cases instead of being left dangling.
    const signal = AbortSignal.any([
      AbortSignal.timeout(OMNIGRAPH_LOOKUP_TIMEOUT_MS),
      c.req.raw.signal,
    ]);
    hits = await lookupLabels(hashes, signal);
  } catch (error) {
    // Client disconnected mid-flight; the response will be discarded by the framework, but
    // re-throw so the upstream cancellation is visible in logs (`app.onError`).
    if (c.req.raw.signal.aborted) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return errorResponse(c, {
        message: `Omnigraph labels lookup timed out after ${OMNIGRAPH_LOOKUP_TIMEOUT_MS}ms`,
        status: 504,
      });
    }
    return errorResponse(c, { message: "Upstream Omnigraph lookup failed", status: 502 });
  }
  const classifications = classifySubmissions(hashed, hits);
  const results = classifications.map(toResultItem);

  const submittedAt = new Date().toISOString();
  const requestId = crypto.randomUUID();

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
