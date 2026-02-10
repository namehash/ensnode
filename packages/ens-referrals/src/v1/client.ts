import {
  deserializeReferralProgramEditionConfigSetArray,
  deserializeReferralProgramEditionConfigSetResponse,
  deserializeReferrerLeaderboardPageResponse,
  deserializeReferrerMetricsEditionsResponse,
  type ReferralProgramEditionConfigSetResponse,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  type ReferrerMetricsEditionsRequest,
  type ReferrerMetricsEditionsResponse,
  type SerializedReferralProgramEditionConfigSetResponse,
  type SerializedReferrerLeaderboardPageResponse,
  type SerializedReferrerMetricsEditionsResponse,
} from "./api";
import {
  buildReferralProgramEditionConfigSet,
  type ReferralProgramEditionConfigSet,
} from "./edition";

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
 * // Get referrer leaderboard for December 2025 edition
 * const leaderboardPage = await client.getReferrerLeaderboardPage({
 *   edition: "2025-12",
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
   * Get Referral Program Edition Config Set
   *
   * Fetches and deserializes a referral program edition config set from a remote URL.
   *
   * @param url - The URL to fetch the edition config set from
   * @returns A ReferralProgramEditionConfigSet (Map of edition slugs to edition configurations)
   *
   * @throws if the fetch fails
   * @throws if the response is not valid JSON
   * @throws if the data doesn't match the expected schema
   *
   * @example
   * ```typescript
   * const url = new URL("https://example.com/editions.json");
   * const editionConfigSet = await ENSReferralsClient.getReferralProgramEditionConfigSet(url);
   * console.log(`Loaded ${editionConfigSet.size} editions`);
   * ```
   */
  static async getReferralProgramEditionConfigSet(
    url: URL,
  ): Promise<ReferralProgramEditionConfigSet> {
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

    const editionConfigs = deserializeReferralProgramEditionConfigSetArray(json);

    return buildReferralProgramEditionConfigSet(editionConfigs);
  }

  /**
   * Fetch Referrer Leaderboard Page
   *
   * Retrieves a paginated list of referrer leaderboard metrics for a specific referral program edition.
   *
   * @param request - Request parameters including edition and pagination
   * @param request.edition - The referral program edition slug (e.g., "2025-12", "2026-03", or any other configured edition slug)
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
   * const editionSlug = "2025-12";
   * const response = await client.getReferrerLeaderboardPage({ edition: editionSlug });
   * if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Ok) {
   *   const {
   *     aggregatedMetrics,
   *     referrers,
   *     rules,
   *     pageContext,
   *     accurateAsOf
   *   } = response.data;
   *   console.log(`Edition: ${editionSlug}`);
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
   *   edition: "2026-03",
   *   page: 2,
   *   recordsPerPage: 50
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response (e.g., unknown edition or data not available)
   * const response = await client.getReferrerLeaderboardPage({ edition: "2025-12" });
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

    url.searchParams.set("edition", request.edition);
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
   * Fetch Referrer Metrics for Specific Editions
   *
   * Retrieves detailed information about a specific referrer for the requested
   * referral program editions. Returns a record mapping each requested edition slug
   * to the referrer's metrics for that edition.
   *
   * The response data maps edition slugs to referrer metrics. Each edition's data is a
   * discriminated union type with a `type` field:
   *
   * **For referrers on the leaderboard** (`ReferrerEditionMetricsRanked`):
   * - `type`: {@link ReferrerEditionMetricsTypeIds.Ranked}
   * - `referrer`: The `AwardedReferrerMetrics` with rank, qualification status, and award share
   * - `rules`: The referral program rules for this edition
   * - `aggregatedMetrics`: Aggregated metrics for all referrers on the leaderboard
   * - `accurateAsOf`: Unix timestamp indicating when the data was last updated
   *
   * **For referrers NOT on the leaderboard** (`ReferrerEditionMetricsUnranked`):
   * - `type`: {@link ReferrerEditionMetricsTypeIds.Unranked}
   * - `referrer`: The `UnrankedReferrerMetrics` from @namehash/ens-referrals
   * - `rules`: The referral program rules for this edition
   * - `aggregatedMetrics`: Aggregated metrics for all referrers on the leaderboard
   * - `accurateAsOf`: Unix timestamp indicating when the data was last updated
   *
   * **Note:** This endpoint does not allow partial success. When `responseCode === Ok`,
   * all requested editions are guaranteed to be present in the response data. If any
   * requested edition cannot be returned, the entire request fails with an error.
   *
   * @see {@link https://www.npmjs.com/package/@namehash/ens-referrals|@namehash/ens-referrals} for calculation details
   *
   * @param request The referrer address and edition slugs to query
   * @returns {ReferrerMetricsEditionsResponse} Returns the referrer metrics for requested editions
   *
   * @throws if the ENSNode request fails
   * @throws if the response data is malformed
   *
   * @example
   * ```typescript
   * // Get referrer metrics for specific editions
   * const response = await client.getReferrerMetricsEditions({
   *   referrer: "0x1234567890123456789012345678901234567890",
   *   editions: ["2025-12", "2026-01"]
   * });
   * if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
   *   // All requested editions are present in response.data
   *   for (const [editionSlug, detail] of Object.entries(response.data)) {
   *     console.log(`Edition: ${editionSlug}`);
   *     console.log(`Type: ${detail.type}`);
   *     if (detail.type === ReferrerEditionMetricsTypeIds.Ranked) {
   *       console.log(`Rank: ${detail.referrer.rank}`);
   *       console.log(`Award Share: ${detail.referrer.awardPoolShare * 100}%`);
   *     }
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Access specific edition data directly (edition is guaranteed to exist when OK)
   * const response = await client.getReferrerMetricsEditions({
   *   referrer: "0x1234567890123456789012345678901234567890",
   *   editions: ["2025-12"]
   * });
   * if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
   *   const edition202512Detail = response.data["2025-12"];
   *   if (edition202512Detail && edition202512Detail.type === ReferrerEditionMetricsTypeIds.Ranked) {
   *     // TypeScript knows this is ReferrerEditionMetricsRanked
   *     console.log(`Edition 2025-12 Rank: ${edition202512Detail.referrer.rank}`);
   *   } else if (edition202512Detail) {
   *     // TypeScript knows this is ReferrerEditionMetricsUnranked
   *     console.log("Referrer is not on the leaderboard for 2025-12");
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response (e.g., unknown edition or data not available)
   * const response = await client.getReferrerMetricsEditions({
   *   referrer: "0x1234567890123456789012345678901234567890",
   *   editions: ["2025-12", "invalid-edition"]
   * });
   *
   * if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getReferrerMetricsEditions(
    request: ReferrerMetricsEditionsRequest,
  ): Promise<ReferrerMetricsEditionsResponse> {
    const url = new URL(
      `/v1/ensanalytics/referrer/${encodeURIComponent(request.referrer)}`,
      this.options.url,
    );

    // Add editions as comma-separated query parameter
    url.searchParams.set("editions", request.editions.join(","));

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
    // ReferrerMetricsEditionsResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferrerMetricsEditionsResponse(
      responseData as SerializedReferrerMetricsEditionsResponse,
    );
  }

  /**
   * Get the currently configured referral program edition config set.
   * Editions are sorted in descending order by start timestamp (most recent first).
   *
   * @returns A response containing the edition config set, or an error response if unavailable.
   *
   * @example
   * ```typescript
   * const response = await client.getEditionConfigSet();
   *
   * if (response.responseCode === ReferralProgramEditionConfigSetResponseCodes.Ok) {
   *   console.log(`Found ${response.data.editions.length} editions`);
   *   for (const edition of response.data.editions) {
   *     console.log(`${edition.slug}: ${edition.displayName}`);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Handle error response
   * const response = await client.getEditionConfigSet();
   *
   * if (response.responseCode === ReferralProgramEditionConfigSetResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getEditionConfigSet(): Promise<ReferralProgramEditionConfigSetResponse> {
    const url = new URL(`/v1/ensanalytics/editions`, this.options.url);

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
    // ReferralProgramEditionConfigSetResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferralProgramEditionConfigSetResponse(
      responseData as SerializedReferralProgramEditionConfigSetResponse,
    );
  }
}
