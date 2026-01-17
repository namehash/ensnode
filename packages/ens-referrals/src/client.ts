import {
  deserializeReferrerDetailResponse,
  deserializeReferrerLeaderboardPageResponse,
  type ReferrerDetailRequest,
  type ReferrerDetailResponse,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  type SerializedReferrerDetailResponse,
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
 * // Get referrer leaderboard
 * const leaderboardPage = await client.getReferrerLeaderboardPage({
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
   * Retrieves a paginated list of referrer leaderboard metrics with contribution percentages.
   * Each referrer's contribution is calculated as a percentage of the grand totals across all referrers.
   *
   * @param request - Pagination parameters
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
   * // Get first page with default page size (25 records)
   * const response = await client.getReferrerLeaderboardPage();
   * if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Ok) {
   *   const {
   *     aggregatedMetrics,
   *     referrers,
   *     rules,
   *     pageContext,
   *     updatedAt
   *   } = response.data;
   *   console.log(aggregatedMetrics);
   *   console.log(referrers);
   *   console.log(rules);
   *   console.log(updatedAt);
   *   console.log(`Page ${pageContext.page} of ${pageContext.totalPages}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get second page with 50 records per page
   * const response = await client.getReferrerLeaderboardPage({ page: 2, recordsPerPage: 50 });
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response, ie. when Referrer Leaderboard is not currently available.
   * const response = await client.getReferrerLeaderboardPage();
   *
   * if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getReferrerLeaderboardPage(
    request?: ReferrerLeaderboardPageRequest,
  ): Promise<ReferrerLeaderboardPageResponse> {
    const url = new URL(`/ensanalytics/referrers`, this.options.url);

    if (request?.page) url.searchParams.set("page", request.page.toString());
    if (request?.recordsPerPage)
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

    // The API can return errors with 500 status, but they're still in the
    // PaginatedAggregatedReferrersResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferrerLeaderboardPageResponse(
      responseData as SerializedReferrerLeaderboardPageResponse,
    );
  }

  /**
   * Fetch Referrer Detail
   *
   * Retrieves detailed information about a specific referrer, whether they are on the
   * leaderboard or not.
   *
   * The response data is a discriminated union type with a `type` field:
   *
   * **For referrers on the leaderboard** (`ReferrerDetailRanked`):
   * - `type`: {@link ReferrerDetailTypeIds.Ranked}
   * - `referrer`: The `AwardedReferrerMetrics` from @namehash/ens-referrals
   * - `rules`: The referral program rules
   * - `aggregatedMetrics`: Aggregated metrics for all referrers on the leaderboard
   * - `accurateAsOf`: Unix timestamp indicating when the data was last updated
   *
   * **For referrers NOT on the leaderboard** (`ReferrerDetailUnranked`):
   * - `type`: {@link ReferrerDetailTypeIds.Unranked}
   * - `referrer`: The `UnrankedReferrerMetrics` from @namehash/ens-referrals
   * - `rules`: The referral program rules
   * - `aggregatedMetrics`: Aggregated metrics for all referrers on the leaderboard
   * - `accurateAsOf`: Unix timestamp indicating when the data was last updated
   *
   * @see {@link https://www.npmjs.com/package/@namehash/ens-referrals|@namehash/ens-referrals} for calculation details
   *
   * @param request The referrer address to query
   * @returns {ReferrerDetailResponse} Returns the referrer detail response
   *
   * @throws if the ENSNode request fails
   * @throws if the response data is malformed
   *
   * @example
   * ```typescript
   * // Get referrer detail for a specific address
   * const response = await client.getReferrerDetail({
   *   referrer: "0x1234567890123456789012345678901234567890"
   * });
   * if (response.responseCode === ReferrerDetailResponseCodes.Ok) {
   *   const { type, referrer, rules, aggregatedMetrics, accurateAsOf } = response.data;
   *   console.log(type); // ReferrerDetailTypeIds.Ranked or ReferrerDetailTypeIds.Unranked
   *   console.log(referrer);
   *   console.log(accurateAsOf);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Use discriminated union to check if referrer is ranked
   * const response = await client.getReferrerDetail({
   *   referrer: "0x1234567890123456789012345678901234567890"
   * });
   * if (response.responseCode === ReferrerDetailResponseCodes.Ok) {
   *   if (response.data.type === ReferrerDetailTypeIds.Ranked) {
   *     // TypeScript knows this is ReferrerDetailRanked
   *     console.log(`Rank: ${response.data.referrer.rank}`);
   *     console.log(`Qualified: ${response.data.referrer.isQualified}`);
   *     console.log(`Award Pool Share: ${response.data.referrer.awardPoolShare * 100}%`);
   *   } else {
   *     // TypeScript knows this is ReferrerDetailUnranked
   *     console.log("Referrer is not on the leaderboard (no referrals yet)");
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response, ie. when Referrer Detail is not currently available.
   * const response = await client.getReferrerDetail({
   *   referrer: "0x1234567890123456789012345678901234567890"
   * });
   *
   * if (response.responseCode === ReferrerDetailResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getReferrerDetail(request: ReferrerDetailRequest): Promise<ReferrerDetailResponse> {
    const url = new URL(
      `/api/ensanalytics/referrers/${encodeURIComponent(request.referrer)}`,
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
    // ReferrerDetailResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferrerDetailResponse(responseData as SerializedReferrerDetailResponse);
  }
}
