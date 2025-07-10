/**
 * Includes functionality to create data transfer objects.
 */

import { Duration, RealtimeIndexingStatusMonitoring } from "@ensnode/ensnode-sdk";
import { getUnixTime, minutesToSeconds } from "date-fns";
import { prettifyError } from "zod/v4";
import * as z from "zod/v4";

/**
 * Default value for the max realtime indexing lag.
 */
export const DEFAULT_MAX_REALTIME_INDEXING_LAG = minutesToSeconds(1);

/**
 * Request schema used to parse request args inside {@link createRequest} function.
 */
const RequestSchema = z.object({
  maxAllowedIndexingLag: z.coerce
    .number()
    .nonnegative()
    .optional()
    .default(DEFAULT_MAX_REALTIME_INDEXING_LAG),
});

/**
 * Input arguments for {@link createRequest} function.
 */
interface CreateRequestArgs {
  maxAllowedIndexingLag: string | undefined;
}

/**
 * Create a validated request object from provided request arguments.
 *
 * @param {CreateRequestArgs} args - The input arguments to validate
 * @returns {RealtimeIndexingStatusMonitoring.Request} Validated request object
 * @throws {Error} When validation fails, includes formatted error details
 */
export function createRequest(args: CreateRequestArgs): RealtimeIndexingStatusMonitoring.Request {
  const parsed = RequestSchema.safeParse(args);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse the realtime indexing status request: \n" +
        prettifyError(parsed.error) +
        "\n",
    );
  }

  return parsed.data;
}

/**
 * Input arguments for {@link createResponse} function.
 */
interface CreateResponseArgs {
  indexingStatus: RealtimeIndexingStatusMonitoring.RealtimeIndexingStatus;
  maxAllowedIndexingLag: Duration;
}

/**
 * Creates a response object for realtime indexing status monitoring.
 *
 * Transforms the indexing status data into a standardized response format,
 * converting dates to Unix timestamps for consistent API responses.
 *
 * @param {CreateResponseArgs} args - The arguments containing indexing status and lag threshold
 * @param {RealtimeIndexingStatusMonitoring.RealtimeIndexingStatus} args.indexingStatus -
 *   Current indexing status with lag and timestamp information
 * @param {Duration} args.maxAllowedIndexingLag - Maximum allowed indexing lag
 * @returns {RealtimeIndexingStatusMonitoring.Response} Formatted response object
 *
 * @example
 * ```typescript
 * createResponse({
 *   indexingStatus: {
 *     currentRealtimeIndexingLag: 45,
 *     oldestLastIndexedBlockDate: new Date('2024-01-15T10:30:00Z')
 *   },
 *   maxAllowedIndexingLag: 60
 * });
 *
 * // Returns:
 * // {
 * //   currentRealtimeIndexingLag: 45,
 * //   oldestLastIndexedBlockTimestamp: 1705317000,
 * //   maxAllowedIndexingLag: 60
 * // }
 * ```
 */
export function createResponse({
  indexingStatus,
  maxAllowedIndexingLag,
}: CreateResponseArgs): RealtimeIndexingStatusMonitoring.Response {
  return {
    currentRealtimeIndexingLag: indexingStatus.currentRealtimeIndexingLag,
    oldestLastIndexedBlockTimestamp: getUnixTime(indexingStatus.oldestLastIndexedBlockDate),
    maxAllowedIndexingLag,
  };
}
