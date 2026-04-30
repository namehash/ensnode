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
 * Maximum number of raw labels accepted per `POST /api/submissions` request.
 *
 * This is independent of how many labelhashes each label expands into (1 if already
 * normalized / unnormalizable, 2 if it has a distinct normalized form). The resolver
 * cap (`LABELS_BY_HASHES_MAX = 200` in `apps/ensapi/src/omnigraph-api/schema/label.ts`)
 * is sized to comfortably accommodate the worst case (2 * `MAX_LABELS_PER_SUBMISSION`)
 * so callers always get the same per-submission limit regardless of normalization.
 */
export const MAX_LABELS_PER_SUBMISSION = 100;

/**
 * Hard upper bound on how long a single `POST /api/submissions` will wait on the
 * Omnigraph labels lookup before failing the request. Prevents a stalled upstream
 * from holding handler resources indefinitely.
 */
export const OMNIGRAPH_LOOKUP_TIMEOUT_MS = 10_000;

/**
 * Runs `fn` with an `AbortSignal` that is aborted after `ms` (rejecting with `Error(message)`)
 * or when `parentSignal` aborts (propagating the parent's cancellation reason). Both timeout
 * expiry and parent cancellation actively abort the underlying work via the signal passed to
 * `fn`, so in-flight HTTP requests can be cancelled rather than left dangling.
 */
async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  message: string,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();

  const onParentAbort = () => controller.abort(parentSignal?.reason);
  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
    } else {
      parentSignal.addEventListener("abort", onParentAbort, { once: true });
    }
  }

  const timeoutError = new Error(message);
  const timer = setTimeout(() => controller.abort(timeoutError), ms);

  try {
    return await fn(controller.signal);
  } catch (err) {
    if (controller.signal.aborted && controller.signal.reason === timeoutError) {
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (parentSignal) parentSignal.removeEventListener("abort", onParentAbort);
  }
}

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

  const hits = await withTimeout(
    (signal) => lookupLabels(hashes, signal),
    OMNIGRAPH_LOOKUP_TIMEOUT_MS,
    `Omnigraph labels lookup timed out after ${OMNIGRAPH_LOOKUP_TIMEOUT_MS}ms`,
    c.req.raw.signal,
  );
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
