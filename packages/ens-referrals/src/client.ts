import {
  deserializeReferralProgramEditionConfigSetArray,
  deserializeReferralProgramEditionSummariesResponse,
  deserializeReferrerLeaderboardPageResponse,
  deserializeReferrerMetricsEditionsResponse,
  type ReferralProgramEditionSummariesResponse,
  type ReferrerLeaderboardPageRequest,
  type ReferrerLeaderboardPageResponse,
  type ReferrerMetricsEditionsRequest,
  type ReferrerMetricsEditionsResponse,
  type SerializedReferralProgramEditionSummariesResponse,
  type SerializedReferrerLeaderboardPageResponse,
  type SerializedReferrerMetricsEditionsResponse,
} from "./api";
import {
  buildReferralProgramEditionConfigSet,
  type ReferralProgramEditionConfigSet,
} from "./edition";

/**
 * Default ENSNode endpoint URL
 */
export const DEFAULT_ENSNODE_API_URL = "https://api.alpha.ensnode.io" as const;

/**
 * Configuration options for an ENS Referrals client
 */
export interface ClientOptions {
  /** The ENSNode URL */
  url: URL;
}

/**
 * ENS Referrals Client
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
   * @remarks Editions whose `rules.awardModel` is not recognized by this client version are
   * preserved as {@link ReferralProgramRulesUnrecognized}. The returned map includes all
   * editions — recognized and unrecognized alike. Callers should check `editionConfig.rules.awardModel`
   * and skip editions with `"unrecognized"` as appropriate. The returned map may be empty.
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
   * @remarks If the server returns a leaderboard page whose `awardModel` is not recognized by
   * this client version, it is preserved as {@link ReferrerLeaderboardPageUnrecognized}. Callers
   * should check `response.data.awardModel` and handle the `"unrecognized"` case accordingly.
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
   *   const { awardModel, pageContext, accurateAsOf } = response.data;
   *   if (awardModel === ReferralProgramAwardModels.Unrecognized) {
   *     console.log(`Unrecognized award model: ${response.data.originalAwardModel} — skipping`);
   *   } else {
   *     const { aggregatedMetrics, referrers, rules } = response.data;
   *     console.log(`Edition: ${editionSlug}`);
   *     console.log(`Subregistry: ${rules.subregistryId}`);
   *     console.log(`Total Referrers: ${pageContext.totalRecords}`);
   *     console.log(`Page ${pageContext.page} of ${pageContext.totalPages}`);
   *   }
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
    if (request.page !== undefined) url.searchParams.set("page", request.page.toString());
    if (request.recordsPerPage !== undefined)
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
   * The response data maps edition slugs to referrer metrics. Each edition's entry is a
   * {@link ReferrerEditionMetrics} discriminated union. Narrow on `awardModel` first to
   * exclude unrecognized models, then on `type` to distinguish ranked from unranked:
   *
   * - `awardModel: "unrecognized"` ({@link ReferrerEditionMetricsUnrecognized}): the server
   *   returned an award model this client does not recognize. Only `originalAwardModel` is
   *   available; no model-specific fields are present.
   * - `type: "ranked"` ({@link ReferrerEditionMetricsTypeIds.Ranked}): the referrer appears on
   *   the leaderboard. `referrer` contains rank, qualification status, and award share.
   * - `type: "unranked"` ({@link ReferrerEditionMetricsTypeIds.Unranked}): the referrer has no
   *   activity in this edition. `referrer` contains zero-value placeholders.
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
   * @remarks If the server returns metrics for an edition whose `awardModel` is not recognized by
   * this client version, that edition's entry in `response.data` is preserved as
   * {@link ReferrerEditionMetricsUnrecognized}. Callers should check each edition's `awardModel`
   * and handle the `"unrecognized"` case accordingly.
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
   *     if (detail.awardModel === ReferralProgramAwardModels.Unrecognized) {
   *       console.log(`Unrecognized award model: ${detail.originalAwardModel} — skipping`);
   *       continue;
   *     }
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
   *   const detail = response.data["2025-12"];
   *   if (detail && detail.awardModel === ReferralProgramAwardModels.Unrecognized) {
   *     console.log(`Unrecognized award model: ${detail.originalAwardModel} — skipping`);
   *   } else if (detail && detail.type === ReferrerEditionMetricsTypeIds.Ranked) {
   *     console.log(`Edition 2025-12 Rank: ${detail.referrer.rank}`);
   *   } else if (detail) {
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
   * Get the currently configured referral program edition summaries.
   * Editions are sorted in descending order by start timestamp (most recent first).
   *
   * @returns A response containing edition summaries, or an error response if unavailable.
   *
   * @remarks Editions whose `rules.awardModel` is not recognized by this client version are
   * preserved as {@link ReferralProgramEditionSummaryUnrecognized}. The returned response includes all
   * editions — recognized and unrecognized alike. Callers should check `edition.awardModel`
   * and skip editions with `"unrecognized"` as appropriate. The returned editions list may be empty.
   *
   * @example
   * ```typescript
   * const response = await client.getEditionSummaries();
   *
   * if (response.responseCode === ReferralProgramEditionSummariesResponseCodes.Ok) {
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
   * const response = await client.getEditionSummaries();
   *
   * if (response.responseCode === ReferralProgramEditionSummariesResponseCodes.Error) {
   *   console.error(response.error);
   *   console.error(response.errorMessage);
   * }
   * ```
   */
  async getEditionSummaries(): Promise<ReferralProgramEditionSummariesResponse> {
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
    // ReferralProgramEditionSummariesResponse format with responseCode: 'error'
    // So we don't need to check response.ok here, just deserialize and let
    // the caller handle the responseCode

    return deserializeReferralProgramEditionSummariesResponse(
      responseData as SerializedReferralProgramEditionSummariesResponse,
    );
  }
}
