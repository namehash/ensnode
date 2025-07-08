import { PonderStatus } from "@ensnode/ponder-metadata";
import { differenceInSeconds, fromUnixTime, minutesToSeconds } from "date-fns";
import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { prettifyError, z } from "zod/v4";

export namespace UptimeMonitoring {
  /**
   * Option values to be used as input for {@link uptimeMonitoring} function.
   */
  export interface MiddlewareOptions {
    /** Query methods */
    query: {
      /** Fetches Ponder Status object for Ponder application */
      ponderStatus(): Promise<PonderStatus>;
    };
  }

  /**
   * Default values to be applied if optional values
   * were not provided with the {@link RawRequest} object.
   */
  export interface RequestDefaults {
    /** Describes the acceptable range in seconds between
     * the last known block on a chain and the last indexed block on that chain.
     */
    gapThreshold: number;
  }

  /**
   * Dictionary of values provided on the Uptime Monitoring request.
   */
  export interface RawRequest {
    gapThreshold: string | undefined;
  }

  /**
   * Parsed counterpart for {@link RawRequest}, can include defaults
   * from {@link RequestDefaults}.
   */
  export interface ParsedRequest {
    /** Describes the acceptable range in seconds between
     * the last known block on a chain and the last indexed block on that chain.
     */
    gapThreshold: number;
  }
}

/**
 * Get the lowest timestamp across all last indexed blocks for every chain from Ponder Status.
 *
 * @param ponderStatus
 * @returns
 */
export function getLowestLastIndexedBlockTimestamp(ponderStatus: PonderStatus): number {
  const lastIndexedBlockTimestamps = Object.values(ponderStatus).map(
    (chainStatus) => chainStatus.block.timestamp,
  );

  return Math.min(...lastIndexedBlockTimestamps);
}

/**
 * Creates a Zod schema for Uptime Monitoring Request.
 */
const createUptimeMonitoringRequestSchema = (requestDefaults: UptimeMonitoring.RequestDefaults) => {
  const GapThresholdSchema = z.coerce
    .number({ error: `"gapThreshold" must be a positive integer.` })
    .int({ error: `"gapThreshold" must be a positive integer.` })
    .min(0, { error: `"gapThreshold" must be a positive integer.` })
    .default(requestDefaults.gapThreshold);

  return z.object({
    gapThreshold: GapThresholdSchema,
  });
};

/**
 * Builds the UptimeMonitoring.ParsedRequest object.
 *
 * This function then validates the raw request parameters against
 * the zod schema ensuring that the request object meets
 * all type checks and invariants.
 */
export function buildUptimeMonitoringRequest(
  rawRequest: UptimeMonitoring.RawRequest,
  requestDefaults: UptimeMonitoring.RequestDefaults,
): UptimeMonitoring.ParsedRequest {
  const schema = createUptimeMonitoringRequestSchema(requestDefaults);
  const parsed = schema.safeParse(rawRequest);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse the uptime monitoring request: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  return parsed.data;
}

export const DEFAULT_REALTIME_INDEXING_GAP_THRESHOLD = minutesToSeconds(10);

/**
 * Creates a Hono Middleware object to be used for providing uptime monitoring
 * tools with information about the current ENSNode service availability.
 */
export function uptimeMonitoring(options: UptimeMonitoring.MiddlewareOptions): MiddlewareHandler {
  return async (ctx) => {
    let realtimeIndexingGapThreshold: number;

    try {
      const rawRequest = {
        gapThreshold: ctx.req.query("gapThreshold"),
      } satisfies UptimeMonitoring.RawRequest;

      const requestDefaults = {
        gapThreshold: DEFAULT_REALTIME_INDEXING_GAP_THRESHOLD,
      } satisfies UptimeMonitoring.RequestDefaults;

      const parsedRequest = buildUptimeMonitoringRequest(rawRequest, requestDefaults);

      realtimeIndexingGapThreshold = parsedRequest.gapThreshold;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HTTPException(400, { message: errorMessage });
    }

    const currentDate = new Date();
    const ponderStatus = await options.query.ponderStatus();

    const lowestLastIndexedBlockTimestamp = getLowestLastIndexedBlockTimestamp(ponderStatus);

    const lowestLastIndexedBlockDate = fromUnixTime(lowestLastIndexedBlockTimestamp);
    const currentRealtimeIndexingGap = differenceInSeconds(currentDate, lowestLastIndexedBlockDate);

    // was realtime indexing gap threshold exceeded?
    if (currentRealtimeIndexingGap > realtimeIndexingGapThreshold) {
      // signal the ENSNode service is not available
      ctx.status(503);
    } else {
      // otherwise, signal the ENSNode service is up and caught-up with realtime indexing
      ctx.status(200);
    }

    return ctx.json({
      realtimeIndexingGapThreshold,
      currentRealtimeIndexingGap,
      lowestLastIndexedBlockTimestamp,
    });
  };
}
