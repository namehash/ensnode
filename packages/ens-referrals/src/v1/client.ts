import {
  deserializeReferralProgramCycleConfigSetArray,
  deserializeReferralProgramCycleConfigSetResponse,
  deserializeReferrerDetailCyclesResponse,
  deserializeReferrerLeaderboardPageResponse,
  type ReferralProgramCycleConfigSetResponse,
  type ReferrerDetailCyclesRequest,
  type ReferrerDetailCyclesResponse,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  type SerializedReferralProgramCycleConfigSetResponse,
  type SerializedReferrerDetailCyclesResponse,
  type SerializedReferrerLeaderboardPageResponse,
} from "./api";
import type { ReferralProgramCycleConfigSet } from "./cycle";

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
 * // Get referrer leaderboard for December 2025 cycle
 * const leaderboardPage = await client.getReferrerLeaderboardPage({
 *   cycle: "2025-12",
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
   * Get Referral Program Cycle Config Set
   *
   * Fetches and deserializes a referral program cycle config set from a remote URL.
   *
   * @param url - The URL to fetch the cycle config set from
   * @returns A ReferralProgramCycleConfigSet (Map of cycle slugs to cycle configurations)
   *
   * @throws if the fetch fails
   * @throws if the response is not valid JSON
   * @throws if the data doesn't match the expected schema
   *
   * @example
   * ```typescript
   * const url = new URL("https://example.com/cycles.json");
   * const cycleConfigSet = await ENSReferralsClient.getReferralProgramCycleConfigSet(url);
   * console.log(`Loaded ${cycleConfigSet.size} cycles`);
   * ```
   */
  static async getReferralProgramCycleConfigSet(url: URL): Promise<ReferralProgramCycleConfigSet> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    const cycleConfigs = deserializeReferralProgramCycleConfigSetArray(json);

    return new Map(cycleConfigs.map((cycleConfig) => [cycleConfig.slug, cycleConfig]));
  }

  /**
   * Fetch Referrer Leaderboard Page
   *
   * Retrieves a paginated list of referrer leaderboard metrics for a specific referral program cycle.
   *
   * @param request - Request parameters including cycle and pagination
   * @param request.cycle - The referral program cycle slug (e.g., "2025-12", "2026-03", or custom cycle slug)
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
   * // Get first page of 2025-12 leaderboard with default page size (25 records)
   * const cycleSlug = "2025-12";
   * const response = await client.getReferrerLeaderboardPage({ cycle: cycleSlug });
   * if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Ok) {
   *   const {
   *     aggregatedMetrics,
   *     referrers,
   *     rules,
   *     pageContext,
   *     accurateAsOf
   *   } = response.data;
   *   console.log(`Cycle: ${cycleSlug}`);
   *   console.log(`Subregistry: ${rules.subregistryId}`);
   *   console.log(`Total Referrers: ${pageContext.totalRecords}`);
   *   console.log(`Page ${pageContext.page} of ${pageContext.totalPages}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get second page of 2026-03 with 50 records per page
   * const response = await client.getReferrerLeaderboardPage({
   *   cycle: "2026-03",
   *   page: 2,
   *   recordsPerPage: 50
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response (e.g., unknown cycle or data not available)
   * const response = await client.getReferrerLeaderboardPage({ cycle: "2025-12" });
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
   * Fetch Referrer Detail for Specific Cycles
   *
   * Retrieves detailed information about a specific referrer for the requested
   * referral program cycles. Returns a record mapping each requested cycle slug
   * to the referrer's detail for that cycle.
   *
   * The response data maps cycle slugs to referrer details. Each cycle's data is a
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
   * **Note:** This endpoint does not allow partial success. When `responseCode === Ok`,
   * all requested cycles are guaranteed to be present in the response data. If any
   * requested cycle cannot be returned, the entire request fails with an error.
   *
   * @see {@link https://www.npmjs.com/package/@namehash/ens-referrals|@namehash/ens-referrals} for calculation details
   *
   * @param request The referrer address and cycle slugs to query
   * @returns {ReferrerDetailCyclesResponse} Returns the referrer detail for requested cycles
   *
   * @throws if the ENSNode request fails
   * @throws if the response data is malformed
   *
   * @example
   * ```typescript
   * // Get referrer detail for specific cycles
   * const response = await client.getReferrerDetailForCycles({
   *   referrer: "0x1234567890123456789012345678901234567890",
   *   cycles: ["2025-12", "2026-01"]
   * });
   * if (response.responseCode === ReferrerDetailCyclesResponseCodes.Ok) {
   *   // All requested cycles are present in response.data
   *   for (const [cycleSlug, detail] of Object.entries(response.data)) {
   *     console.log(`Cycle: ${cycleSlug}`);
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
   * const response = await client.getReferrerDetailForCycles({
   *   referrer: "0x1234567890123456789012345678901234567890",
   *   cycles: ["2025-12"]
   * });
   * if (response.responseCode === ReferrerDetailCyclesResponseCodes.Ok) {
   *   const cycle202512Detail = response.data["2025-12"];
   *   if (cycle202512Detail && cycle202512Detail.type === ReferrerDetailTypeIds.Ranked) {
   *     // TypeScript knows this is ReferrerDetailRanked
   *     console.log(`Cycle 2025-12 Rank: ${cycle202512Detail.referrer.rank}`);
   *   } else if (cycle202512Detail) {
   *     // TypeScript knows this is ReferrerDetailUnranked
   *     console.log("Referrer is not on the leaderboard for 2025-12");
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response (e.g., unknown cycle or data not available)
   * const response = await client.getReferrerDetailForCycles({
   *   referrer: "0x1234567890123456789012345678901234567890",
   *   cycles: ["2025-12", "invalid-cycle"]
   * });
   *
   * if (response.responseCode === ReferrerDetailCyclesResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getReferrerDetailForCycles(
    request: ReferrerDetailCyclesRequest,
  ): Promise<ReferrerDetailCyclesResponse> {
    const url = new URL(
      `/v1/ensanalytics/referrer/${encodeURIComponent(request.referrer)}`,
      this.options.url,
    );

    // Add cycles as comma-separated query parameter
    url.searchParams.set("cycles", request.cycles.join(","));

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
    // ReferrerDetailCyclesResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferrerDetailCyclesResponse(
      responseData as SerializedReferrerDetailCyclesResponse,
    );
  }

  /**
   * Get the currently configured referral program cycle config set.
   * Cycles are sorted in descending order by start timestamp (most recent first).
   *
   * @returns A response containing the cycle config set, or an error response if unavailable.
   *
   * @example
   * ```typescript
   * const response = await client.getCycleConfigSet();
   *
   * if (response.responseCode === ReferralProgramCycleConfigSetResponseCodes.Ok) {
   *   console.log(`Found ${response.data.cycles.length} cycles`);
   *   for (const cycle of response.data.cycles) {
   *     console.log(`${cycle.slug}: ${cycle.displayName}`);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response
   * const response = await client.getCycleConfigSet();
   *
   * if (response.responseCode === ReferralProgramCycleConfigSetResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getCycleConfigSet(): Promise<ReferralProgramCycleConfigSetResponse> {
    const url = new URL(`/v1/ensanalytics/cycles`, this.options.url);

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
    // ReferralProgramCycleConfigSetResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferralProgramCycleConfigSetResponse(
      responseData as SerializedReferralProgramCycleConfigSetResponse,
    );
  }
}
