import {
  deserializeReferrerDetailAllCyclesResponse,
  deserializeReferrerLeaderboardPageResponse,
  type ReferrerDetailAllCyclesResponse,
  type ReferrerDetailRequest,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  type SerializedReferrerDetailAllCyclesResponse,
  type SerializedReferrerLeaderboardPageResponse,
} from "./api";

/**
 * Default ENSNode API endpoint URL
 */
export const DEFAULT_ENSNODE_API_URL = "https://api.alpha.ensnode.io" as const;

/**
 * Configuration options for ENS Referrals API client
 */
export interface ClientOptions {
  /** The ENSNode API URL */
  url: URL;
}

/**
 * ENS Referrals API Client
 *
 * Provides access to ENS Referrals data and leaderboard information.
 *
 * @example
 * ```typescript
 * // Create client with default options
 * const client = new ENSReferralsClient();
 *
 * // Get referrer leaderboard for cycle-1
 * const leaderboardPage = await client.getReferrerLeaderboardPage({
 *   cycle: "cycle-1",
 *   page: 1,
 *   recordsPerPage: 25
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom configuration
 * const client = new ENSReferralsClient({
 *   url: new URL("https://my-ensnode-instance.com"),
 * });
 * ```
 */
export class ENSReferralsClient {
  private readonly options: ClientOptions;

  static defaultOptions(): ClientOptions {
    return {
      url: new URL(DEFAULT_ENSNODE_API_URL),
    };
  }

  constructor(options: Partial<ClientOptions> = {}) {
    this.options = {
      ...ENSReferralsClient.defaultOptions(),
      ...options,
    };
  }

  getOptions(): Readonly<ClientOptions> {
    return Object.freeze({
      url: new URL(this.options.url.href),
    });
  }

  /**
   * Fetch Referrer Leaderboard Page
   *
   * Retrieves a paginated list of referrer leaderboard metrics for a specific referral program cycle.
   * Each referrer's contribution is calculated as a percentage of the grand totals across all referrers
   * within that cycle.
   *
   * @param request - Request parameters including cycle and pagination
   * @param request.cycle - The referral program cycle ID (e.g., "cycle-1", "cycle-2", or custom cycle ID)
   * @param request.page - The page number to retrieve (1-indexed, default: 1)
   * @param request.recordsPerPage - Number of records per page (default: 25, max: 100)
   * @returns {ReferrerLeaderboardPageResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   *
   * @example
   * ```typescript
   * // Get first page of cycle-1 leaderboard with default page size (25 records)
   * const cycleId = "cycle-1";
   * const response = await client.getReferrerLeaderboardPage({ cycle: cycleId });
   * if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Ok) {
   *   const {
   *     aggregatedMetrics,
   *     referrers,
   *     rules,
   *     pageContext,
   *     accurateAsOf
   *   } = response.data;
   *   console.log(`Cycle: ${cycleId}`);
   *   console.log(`Subregistry: ${rules.subregistryId}`);
   *   console.log(`Total Referrers: ${pageContext.totalRecords}`);
   *   console.log(`Page ${pageContext.page} of ${pageContext.totalPages}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get second page of cycle-2 with 50 records per page
   * const response = await client.getReferrerLeaderboardPage({
   *   cycle: "cycle-2",
   *   page: 2,
   *   recordsPerPage: 50
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response (e.g., unknown cycle or data not available)
   * const response = await client.getReferrerLeaderboardPage({ cycle: "cycle-1" });
   *
   * if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getReferrerLeaderboardPage(
    request: ReferrerLeaderboardPageRequest,
  ): Promise<ReferrerLeaderboardPageResponse> {
    const url = new URL(`/v1/ensanalytics/referral-leaderboard`, this.options.url);

    url.searchParams.set("cycle", request.cycle);
    if (request.page) url.searchParams.set("page", request.page.toString());
    if (request.recordsPerPage)
      url.searchParams.set("recordsPerPage", request.recordsPerPage.toString());

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // The API can return errors with various status codes, but they're still in the
    // ReferrerLeaderboardPageResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferrerLeaderboardPageResponse(
      responseData as SerializedReferrerLeaderboardPageResponse,
    );
  }

  /**
   * Fetch Referrer Detail Across All Cycles
   *
   * Retrieves detailed information about a specific referrer across all configured
   * referral program cycles. Returns a record mapping each cycle ID to the referrer's
   * detail for that cycle.
   *
   * The response data maps cycle IDs to referrer details. Each cycle's data is a
   * discriminated union type with a `type` field:
   *
   * **For referrers on the leaderboard** (`ReferrerDetailRanked`):
   * - `type`: {@link ReferrerDetailTypeIds.Ranked}
   * - `referrer`: The `AwardedReferrerMetrics` with rank, qualification status, and award share
   * - `rules`: The referral program rules for this cycle
   * - `aggregatedMetrics`: Aggregated metrics for all referrers on the leaderboard
   * - `accurateAsOf`: Unix timestamp indicating when the data was last updated
   *
   * **For referrers NOT on the leaderboard** (`ReferrerDetailUnranked`):
   * - `type`: {@link ReferrerDetailTypeIds.Unranked}
   * - `referrer`: The `UnrankedReferrerMetrics` from @namehash/ens-referrals
   * - `rules`: The referral program rules for this cycle
   * - `aggregatedMetrics`: Aggregated metrics for all referrers on the leaderboard
   * - `accurateAsOf`: Unix timestamp indicating when the data was last updated
   *
   * **Note:** The API uses a fail-fast approach. If ANY cycle fails to load, the entire request
   * returns an error. When `responseCode === Ok`, ALL configured cycles are guaranteed to be
   * present in the response data.
   *
   * @see {@link https://www.npmjs.com/package/@namehash/ens-referrals|@namehash/ens-referrals} for calculation details
   *
   * @param request The referrer address to query
   * @returns {ReferrerDetailAllCyclesResponse} Returns the referrer detail for all cycles
   *
   * @throws if the ENSNode request fails
   * @throws if the response data is malformed
   *
   * @example
   * ```typescript
   * // Get referrer detail across all cycles
   * const response = await client.getReferrerDetail({
   *   referrer: "0x1234567890123456789012345678901234567890"
   * });
   * if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Ok) {
   *   // All configured cycles are present in response.data
   *   for (const [cycleId, detail] of Object.entries(response.data)) {
   *     console.log(`Cycle: ${cycleId}`);
   *     console.log(`Type: ${detail.type}`);
   *     if (detail.type === ReferrerDetailTypeIds.Ranked) {
   *       console.log(`Rank: ${detail.referrer.rank}`);
   *       console.log(`Award Share: ${detail.referrer.awardPoolShare * 100}%`);
   *     }
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Access specific cycle data directly (cycle is guaranteed to exist when OK)
   * const response = await client.getReferrerDetail({
   *   referrer: "0x1234567890123456789012345678901234567890"
   * });
   * if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Ok) {
   *   // If "cycle-1" is configured, it will be in response.data
   *   const cycle1Detail = response.data["cycle-1"];
   *   if (cycle1Detail && cycle1Detail.type === ReferrerDetailTypeIds.Ranked) {
   *     // TypeScript knows this is ReferrerDetailRanked
   *     console.log(`Cycle 1 Rank: ${cycle1Detail.referrer.rank}`);
   *   } else if (cycle1Detail) {
   *     // TypeScript knows this is ReferrerDetailUnranked
   *     console.log("Referrer is not on the leaderboard for cycle-1");
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response (e.g., a cycle failed to load)
   * const response = await client.getReferrerDetail({
   *   referrer: "0x1234567890123456789012345678901234567890"
   * });
   *
   * if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Error) {
   *   console.error(response.error);
   *   // Error message includes which cycle failed
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getReferrerDetail(
    request: ReferrerDetailRequest,
  ): Promise<ReferrerDetailAllCyclesResponse> {
    const url = new URL(
      `/v1/ensanalytics/referral-leaderboard/${encodeURIComponent(request.referrer)}`,
      this.options.url,
    );

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // The API can return errors with 500 status, but they're still in the
    // ReferrerDetailAllCyclesResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferrerDetailAllCyclesResponse(
      responseData as SerializedReferrerDetailAllCyclesResponse,
    );
  }
}
