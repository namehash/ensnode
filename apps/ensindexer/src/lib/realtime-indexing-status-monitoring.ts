import type { RealtimeIndexingStatusMonitoring } from "@ensnode/ensnode-sdk";
import { PonderStatus } from "@ensnode/ponder-metadata";
import { getUnixTime, minutesToSeconds } from "date-fns";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prettifyError, z } from "zod/v4";

export namespace RealtimeIndexingStatusMonitoringApp {
  /**
   * Option values to be used as input for {@link realtimeIndexingStatusMonitoringApp} function.
   */
  export interface Options {
    /** Query methods */
    query: {
      /** Fetches Ponder Status object for Ponder application */
      ponderStatus(): Promise<PonderStatus>;
    };
  }

  /**
   * Default values to be applied if optional values
   * were not provided with the {@link RealtimeIndexingStatusMonitoring.RawRequest} object.
   */
  export interface RequestDefaults {
    /** Describes the acceptable range in seconds between
     * the last known block on a chain and the last indexed block on that chain.
     */
    maxAllowedIndexingLag: RealtimeIndexingStatusMonitoring.TimeSpanInSeconds;
  }
}

const NonNegativeIntegerSchema = z.coerce
  .number({ error: `Value must be a non-negative integer.` })
  .int({ error: `Value must be a non-negative integer.` })
  .min(0, { error: `Value must be a non-negative integer.` });

export const DEFAULT_REALTIME_INDEXING_MAX_LAG = minutesToSeconds(10);

const createRealtimeIndexingStatusMonitoringRequestSchema = (
  defaultValues: RealtimeIndexingStatusMonitoringApp.RequestDefaults,
) =>
  z.object({
    maxAllowedIndexingLag: NonNegativeIntegerSchema.default(
      defaultValues.maxAllowedIndexingLag,
    ).transform((v) => v as RealtimeIndexingStatusMonitoring.TimeSpanInSeconds),
  });

/**
 * Get the unix timestamp of the oldest last indexed block across all chains from Ponder Status.
 *
 * @param ponderStatus
 * @returns unix timestamp of the oldest last indexed block
 * @throws if the oldest indexer block timestamp was not a non-negative integer
 */
export function getOldestLastIndexedBlockTimestamp(
  ponderStatus: PonderStatus,
): RealtimeIndexingStatusMonitoring.UnixTimestamp {
  const lastIndexedBlockTimestamps = Object.values(ponderStatus).map(
    (chainStatus) => chainStatus.block.timestamp,
  );
  const oldestLastIndexedBlockTimestamp = Math.min(...lastIndexedBlockTimestamps);

  // invariant: block timestamp is a non negative integer
  if (NonNegativeIntegerSchema.safeParse(oldestLastIndexedBlockTimestamp).error) {
    throw new Error(
      `The oldestLastIndexedBlockTimestamp was set to "${oldestLastIndexedBlockTimestamp}". It must be a non-negative integer.`,
    );
  }

  return oldestLastIndexedBlockTimestamp as RealtimeIndexingStatusMonitoring.UnixTimestamp;
}
/**
 * Builds the RealtimeIndexingStatusMonitoring.ParsedRequest object.
 *
 * This function then validates the raw request parameters against
 * the zod schema ensuring that the request object meets
 * all type checks and invariants.
 */
export function buildRealtimeIndexingStatusMonitoringRequest(
  rawRequest: RealtimeIndexingStatusMonitoring.RawRequest,
  requestDefaults: RealtimeIndexingStatusMonitoringApp.RequestDefaults,
): RealtimeIndexingStatusMonitoring.ParsedRequest {
  const schema = createRealtimeIndexingStatusMonitoringRequestSchema(requestDefaults);
  const parsed = schema.safeParse(rawRequest);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse the realtime indexing status monitoring request: \n" +
        prettifyError(parsed.error) +
        "\n",
    );
  }

  return parsed.data;
}

/**
 * Get the current realtime indexing status based on the provided Ponder Status.
 */
function getRealtimeIndexingStatus(
  ponderStatus: PonderStatus,
): RealtimeIndexingStatusMonitoring.RealtimeIndexingStatus {
  const currentTimestamp = getUnixTime(
    new Date(),
  ) as RealtimeIndexingStatusMonitoring.UnixTimestamp;

  const oldestLastIndexedBlockTimestamp = getOldestLastIndexedBlockTimestamp(ponderStatus);

  const currentRealtimeIndexingLag = (currentTimestamp -
    oldestLastIndexedBlockTimestamp) as RealtimeIndexingStatusMonitoring.TimeSpanInSeconds;

  return {
    currentRealtimeIndexingLag,
    oldestLastIndexedBlockTimestamp,
  } satisfies RealtimeIndexingStatusMonitoring.RealtimeIndexingStatus;
}

/**
 * Creates a Hono App object to be used for providing
 * the realtime indexing status monitoring tools with
 * information if the requested realtime indexing gap
 * has been achieved or not.
 */
export function realtimeIndexingStatusMonitoringApp(
  options: RealtimeIndexingStatusMonitoringApp.Options,
): Hono {
  const app = new Hono();

  app.get("/", async (ctx) => {
    let maxAllowedIndexingLag: RealtimeIndexingStatusMonitoring.TimeSpanInSeconds;

    try {
      const rawRequest = {
        maxAllowedIndexingLag: ctx.req.query("maxAllowedIndexingLag"),
      } satisfies RealtimeIndexingStatusMonitoring.RawRequest;

      const requestDefaults = {
        maxAllowedIndexingLag: DEFAULT_REALTIME_INDEXING_MAX_LAG,
      } satisfies RealtimeIndexingStatusMonitoringApp.RequestDefaults;

      const parsedRequest = buildRealtimeIndexingStatusMonitoringRequest(
        rawRequest,
        requestDefaults,
      );

      maxAllowedIndexingLag = parsedRequest.maxAllowedIndexingLag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HTTPException(400, { message: errorMessage });
    }

    const ponderStatus = await options.query.ponderStatus();

    const { currentRealtimeIndexingLag, oldestLastIndexedBlockTimestamp } =
      getRealtimeIndexingStatus(ponderStatus);

    // does the `currentRealtimeIndexingLag` exceed the `maxAllowedIndexingLag` value
    if (currentRealtimeIndexingLag > maxAllowedIndexingLag) {
      // signal that the requested realtime indexing gap is not currently achieved
      ctx.status(503);
    } else {
      // signal that the requested realtime indexing gap has been achieved
      ctx.status(200);
    }

    return ctx.json({
      currentRealtimeIndexingLag,
      maxAllowedIndexingLag,
      oldestLastIndexedBlockTimestamp,
    } satisfies RealtimeIndexingStatusMonitoring.Response);
  });

  return app;
}
