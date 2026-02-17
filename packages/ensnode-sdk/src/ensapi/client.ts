import type { ResolverRecordsSelection } from "../resolution";
import {
  deserializedNameTokensResponse,
  deserializeEnsApiConfigResponse,
  deserializeEnsApiIndexingStatusResponse,
  deserializeErrorResponse,
  deserializeRegistrarActionsResponse,
  type EnsApiConfigResponse,
  type EnsApiIndexingStatusResponse,
  type ErrorResponse,
  type NameTokensRequest,
  type NameTokensResponse,
  type RegistrarActionsFilter,
  RegistrarActionsFilterTypes,
  type RegistrarActionsOrder,
  RegistrarActionsOrders,
  type RegistrarActionsRequest,
  type RegistrarActionsResponse,
  type ResolvePrimaryNameRequest,
  type ResolvePrimaryNameResponse,
  type ResolvePrimaryNamesRequest,
  type ResolvePrimaryNamesResponse,
  type ResolveRecordsRequest,
  type ResolveRecordsResponse,
  type SerializedEnsApiConfigResponse,
  type SerializedEnsApiIndexingStatusResponse,
  type SerializedNameTokensResponse,
  type SerializedRegistrarActionsResponse,
} from "./api";
import { ClientError } from "./client-error";
import { getDefaultEnsNodeUrl } from "./deployments";

/**
 * Configuration options for ENSNode API client
 */
export interface ClientOptions {
  /** The ENSNode API URL */
  url: URL;
}

/**
 * EnsApi Client
 *
 * Provides access to the following ENSNode APIs:
 * - Resolution API
 * - Configuration API
 * - Indexing Status API
 * - Registrar Actions API
 * - Name Tokens API
 *
 * @example
 * ```typescript
 * import { EnsApiClient } from "@ensnode/ensnode-sdk";
 *
 * // Create client with default options
 * const client = new EnsApiClient();
 *
 * // Use resolution methods
 * const { records } = await client.resolveRecords("jesse.base.eth", {
 *   addresses: [60],
 *   texts: ["avatar"]
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { ENSNamespaceIds, EnsApiClient, getDefaultEnsNodeUrl } from "@ensnode/ensnode-sdk";
 *
 * // Use default ENSNode API URL for Mainnet
 * const client = new EnsApiClient({
 *   url: getDefaultEnsNodeUrl(ENSNamespaceIds.Mainnet),
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { ENSNamespaceIds, EnsApiClient, getDefaultEnsNodeUrl } from "@ensnode/ensnode-sdk";
 *
 * // Use default ENSNode API URL for Sepolia
 * const client = new EnsApiClient({
 *   url: getDefaultEnsNodeUrl(ENSNamespaceIds.Sepolia),
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { EnsApiClient } from "@ensnode/ensnode-sdk";
 *
 * // Custom configuration
 * const client = new EnsApiClient({
 *   url: new URL("https://my-ensnode-instance.com"),
 * });
 * ```
 */
export class EnsApiClient {
  private readonly options: ClientOptions;

  static defaultOptions(): ClientOptions {
    return {
      url: getDefaultEnsNodeUrl(),
    };
  }

  constructor(options: Partial<ClientOptions> = {}) {
    this.options = {
      ...EnsApiClient.defaultOptions(),
      ...options,
    };
  }

  getOptions(): Readonly<ClientOptions> {
    return Object.freeze({
      url: new URL(this.options.url.href),
    });
  }

  /**
   * Resolves records for an ENS name (Forward Resolution).
   *
   * The returned `name` field, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).
   * If the name record returned by the resolver is not normalized, `null` is returned as if no name record was set.
   *
   * @param name The ENS Name whose records to resolve
   * @param selection selection of Resolver records
   * @param options additional options
   * @param options.accelerate whether to attempt Protocol Acceleration (default false)
   * @param options.trace whether to include a trace in the response (default false)
   * @returns ResolveRecordsResponse<SELECTION>
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * const { records } = await client.resolveRecords("jesse.base.eth", {
   *   addresses: [60],
   *   texts: ["avatar", "com.twitter"]
   * });
   *
   * console.log(records);
   * // {
   * //   addresses: {
   * //     60: "0xabcd..."
   * //   },
   * //   texts: {
   * //     avatar: "https://example.com/image.jpg",
   * //     "com.twitter": null, // if not set, for example
   * //   }
   * // }
   * ```
   */
  async resolveRecords<SELECTION extends ResolverRecordsSelection>(
    name: ResolveRecordsRequest<SELECTION>["name"],
    selection: ResolveRecordsRequest<SELECTION>["selection"],
    options?: Omit<ResolveRecordsRequest<SELECTION>, "name" | "selection">,
  ): Promise<ResolveRecordsResponse<SELECTION>> {
    const url = new URL(`/api/resolve/records/${encodeURIComponent(name)}`, this.options.url);

    // Add query parameters based on selection
    if (selection.name) {
      url.searchParams.set("name", "true");
    }

    if (selection.addresses && selection.addresses.length > 0) {
      url.searchParams.set("addresses", selection.addresses.join(","));
    }

    if (selection.texts && selection.texts.length > 0) {
      url.searchParams.set("texts", selection.texts.join(","));
    }

    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate) url.searchParams.set("accelerate", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw ClientError.fromErrorResponse(error);
    }

    const data = await response.json();
    return data as ResolveRecordsResponse<SELECTION>;
  }

  /**
   * Resolves the primary name of a specified address (Reverse Resolution) on a specific chain.
   *
   * If the chainId-specific Primary Name is not defined, but the `address` specifies a valid
   * [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default
   * Name will be returned. You _may_ query the Default EVM Chain Id (`0`) in order to determine the
   * `address`'s Default Name directly.
   *
   * The returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).
   * If the primary name set for the address is not normalized, `null` is returned as if no primary name was set.
   *
   * @param address The Address whose Primary Name to resolve
   * @param chainId The chain id within which to query the address' ENSIP-19 Multichain Primary Name
   * @param options additional options
   * @param options.accelerate whether to attempt Protocol Acceleration (default false)
   * @param options.trace whether to include a trace in the response (default false)
   * @returns ResolvePrimaryNameResponse
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * // Resolve the address' Primary Name on Ethereum Mainnet
   * const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", 1);
   * // name === 'gregskril.eth'
   *
   * // Resolve the address' Primary Name on Base
   * const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", 8453);
   * // name === 'greg.base.eth'
   *
   * // Resolve the address' Default Primary Name
   * const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", 0);
   * // name === 'gregskril.eth'
   * ```
   */
  async resolvePrimaryName(
    address: ResolvePrimaryNameRequest["address"],
    chainId: ResolvePrimaryNameRequest["chainId"],
    options?: Omit<ResolvePrimaryNameRequest, "address" | "chainId">,
  ): Promise<ResolvePrimaryNameResponse> {
    const url = new URL(`/api/resolve/primary-name/${address}/${chainId}`, this.options.url);

    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate) url.searchParams.set("accelerate", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw ClientError.fromErrorResponse(error);
    }

    const data = await response.json();
    return data as ResolvePrimaryNameResponse;
  }

  /**
   * Resolves the primary names of a specified address across multiple chains.
   *
   * For each Primary Name, if the chainId-specific Primary Name is not defined, but the `address`
   * specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name),
   * the Default Name will be returned. You _may not_ query the Default EVM Chain Id (`0`) directly,
   * and should rely on the aforementioned per-chain defaulting behavior.
   *
   * Each returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).
   * If the primary name set for the address on any chain is not normalized, `null` is returned for
   * that chain as if no primary name was set.
   *
   * @param address The Address whose Primary Names to resolve
   * @param options additional options
   * @param options.chainIds The set of chain ids within which to query the address' ENSIP-19
   *  Multichain Primary Name (default: all ENSIP-19 supported chains)
   * @param options.accelerate whether to attempt Protocol Acceleration (default: true)
   * @param options.trace whether to include a trace in the response (default: false)
   * @returns ResolvePrimaryNamesResponse
   * @throws If the request fails or the ENSNode API returns an error response
   *
   * @example
   * ```typescript
   * // Resolve the address' Primary Names on all ENSIP-19 supported chain ids
   * const { names } = await client.resolvePrimaryNames("0x179A862703a4adfb29896552DF9e307980D19285");
   *
   * console.log(names);
   * // {
   * //   "1": "gregskril.eth", // Default Primary Name
   * //   "10": "gregskril.eth", // Default Primary Name
   * //   "8453": "greg.base.eth", // Base-specific Primary Name!
   * //   "42161": "gregskril.eth", // Default Primary Name
   * //   "59144": "gregskril.eth", // Default Primary Name
   * //   "534352": "gregskril.eth" // Default Primary Name
   * // }
   *
   * // Resolve the address' Primary Names on specific chain Ids
   * const { names } = await client.resolvePrimaryNames("0xabcd...", [1, 8453]);
   *
   * console.log(names);
   * // {
   * //   "1": "gregskril.eth",
   * //   "8453": "greg.base.eth", // base-specific Primary Name!
   * // }
   * ```
   */
  async resolvePrimaryNames(
    address: ResolvePrimaryNamesRequest["address"],
    options?: Omit<ResolvePrimaryNamesRequest, "address">,
  ): Promise<ResolvePrimaryNamesResponse> {
    const url = new URL(`/api/resolve/primary-names/${address}`, this.options.url);

    if (options?.chainIds) url.searchParams.set("chainIds", options.chainIds.join(","));
    if (options?.trace) url.searchParams.set("trace", "true");
    if (options?.accelerate) url.searchParams.set("accelerate", "true");

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw ClientError.fromErrorResponse(error);
    }

    const data = await response.json();
    return data as ResolvePrimaryNamesResponse;
  }

  /**
   * Fetch ENSApi Config
   *
   * Fetch the ENSApi's configuration.
   *
   * @returns {EnsApiConfigResponse}
   *
   * @throws if the ENSApi request fails
   * @throws if the ENSApi returns an error response
   * @throws if the ENSApi response breaks required invariants
   */
  async config(): Promise<EnsApiConfigResponse> {
    const url = new URL(`/api/config`, this.options.url);

    const response = await fetch(url);

    // ENSApi should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    if (!response.ok) {
      const errorResponse = deserializeErrorResponse(responseData);
      throw new Error(`Fetching ENSApi Config Failed: ${errorResponse.message}`);
    }

    return deserializeEnsApiConfigResponse(responseData as SerializedEnsApiConfigResponse);
  }

  /**
   * Fetch ENSApi Indexing Status
   *
   * @returns {EnsApiIndexingStatusResponse}
   *
   * @throws if the ENSApi request fails
   * @throws if the ENSApi returns an error response
   * @throws if the ENSApi response breaks required invariants
   */
  async indexingStatus(): Promise<EnsApiIndexingStatusResponse> {
    const url = new URL(`/api/indexing-status`, this.options.url);

    const response = await fetch(url);

    // ENSApi should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // handle response errors accordingly
    if (!response.ok) {
      // check for a generic errorResponse
      let errorResponse: ErrorResponse | undefined;
      try {
        errorResponse = deserializeErrorResponse(responseData);
      } catch {
        // if errorResponse could not be determined,
        // it means the response includes indexing status data
        console.log("Indexing Status API: handling a known indexing status server error.");
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSApi Indexing Status Failed: ${errorResponse.message}`);
      }
    }

    return deserializeEnsApiIndexingStatusResponse(
      responseData as SerializedEnsApiIndexingStatusResponse,
    );
  }

  /**
   * Fetch ENSNode Registrar Actions
   *
   * Retrieves a paginated list of registrar actions with optional filters.
   *
   * @param request is a request configuration.
   * @param request.page sets the page number to retrieve (1-indexed, default: 1)
   * @param request.recordsPerPage sets the number of records per page (default: 10, max: 100)
   * @param request.filters is an optional request filter configuration.
   * @param request.order sets the order of results in the response by field and direction.
   * @returns {RegistrarActionsResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   *
   * @example
   * ```ts
   * import {
   *   registrarActionsFilter,
   *   EnsApiClient,
   * } from "@ensnode/ensnode-sdk";
   * import { namehash } from "viem/ens";
   *
   * const client: EnsApiClient;
   *
   * // Get first page with default page size (10 records)
   * const response = await client.registrarActions();
   * if (response.responseCode === RegistrarActionsResponseCodes.Ok) {
   *   const { registrarActions, pageContext } = response;
   *   console.log(registrarActions);
   *   console.log(`Page ${pageContext.page} of ${pageContext.totalPages}`);
   *   console.log(`Accurate as of: ${response.accurateAsOf}`);
   * }
   *
   * // Get second page with 25 records per page
   * const response = await client.registrarActions({
   *   page: 2,
   *   recordsPerPage: 25,
   * });
   *
   * // get latest registrar action records associated with
   * // subregistry managing `eth` name
   * await client.registrarActions({
   *   filters: [registrarActionsFilter.byParentNode(namehash('eth'))],
   * });
   *
   * // get latest registrar action records which include referral info
   * await client.registrarActions({
   *   filters: [registrarActionsFilter.withReferral(true)],
   * });
   *
   * // get latest registrar action records for a specific decoded referrer
   * await client.registrarActions({
   *   filters: [registrarActionsFilter.byDecodedReferrer("0x1234567890123456789012345678901234567890")],
   * });
   *
   * // get latest 10 registrar action records associated with
   * // subregistry managing `base.eth` name
   * await client.registrarActions({
   *   filters: [registrarActionsFilter.byParentNode(namehash('base.eth'))],
   *   recordsPerPage: 10
   * });
   *
   * // get registrar actions within a specific time range
   * const beginTimestamp = 1764547200; // Dec 1, 2025, 00:00:00 UTC
   * const endTimestamp = 1767225600; // Jan 1, 2026, 00:00:00 UTC
   * await client.registrarActions({
   *   filters: [
   *     registrarActionsFilter.beginTimestamp(beginTimestamp),
   *     registrarActionsFilter.endTimestamp(endTimestamp),
   *   ],
   * });
   *
   * // get registrar actions from a specific timestamp onwards
   * await client.registrarActions({
   *   filters: [registrarActionsFilter.beginTimestamp(1764547200)],
   * });
   *
   * // get registrar actions up to a specific timestamp
   * await client.registrarActions({
   *   filters: [registrarActionsFilter.endTimestamp(1767225600)],
   * });
   * ```
   */
  async registrarActions(request: RegistrarActionsRequest = {}): Promise<RegistrarActionsResponse> {
    const buildUrlPath = (filters: RegistrarActionsFilter[] | undefined) => {
      const bySubregistryNodeFilter = filters?.find(
        (f) => f.filterType === RegistrarActionsFilterTypes.BySubregistryNode,
      );

      return bySubregistryNodeFilter
        ? new URL(`/api/registrar-actions/${bySubregistryNodeFilter.value}`, this.options.url)
        : new URL(`/api/registrar-actions`, this.options.url);
    };

    const buildWithReferralArg = (filters: RegistrarActionsFilter[] | undefined) => {
      const withReferralFilter = filters?.find(
        (f) => f.filterType === RegistrarActionsFilterTypes.WithEncodedReferral,
      );

      return withReferralFilter ? { key: "withReferral", value: "true" } : null;
    };

    const buildDecodedReferrerArg = (filters: RegistrarActionsFilter[] | undefined) => {
      const decodedReferrerFilter = filters?.find(
        (f) => f.filterType === RegistrarActionsFilterTypes.ByDecodedReferrer,
      );

      return decodedReferrerFilter
        ? { key: "decodedReferrer", value: decodedReferrerFilter.value }
        : null;
    };

    const buildBeginTimestampArg = (filters: RegistrarActionsFilter[] | undefined) => {
      const beginTimestampFilter = filters?.find(
        (f) => f.filterType === RegistrarActionsFilterTypes.BeginTimestamp,
      );

      return beginTimestampFilter
        ? { key: "beginTimestamp", value: beginTimestampFilter.value.toString() }
        : null;
    };

    const buildEndTimestampArg = (filters: RegistrarActionsFilter[] | undefined) => {
      const endTimestampFilter = filters?.find(
        (f) => f.filterType === RegistrarActionsFilterTypes.EndTimestamp,
      );

      return endTimestampFilter
        ? { key: "endTimestamp", value: endTimestampFilter.value.toString() }
        : null;
    };

    const buildOrderArg = (order: RegistrarActionsOrder) => {
      switch (order) {
        case RegistrarActionsOrders.LatestRegistrarActions: {
          const [field, direction] = order.split("=");
          return {
            key: `sort[${field}]`,
            value: `${direction}`,
          };
        }
      }
    };

    const url = buildUrlPath(request.filters);

    if (request.order) {
      const orderArgs = buildOrderArg(request.order);

      url.searchParams.set(orderArgs.key, orderArgs.value);
    }

    if (request.page) {
      url.searchParams.set("page", request.page.toString());
    }

    if (request.recordsPerPage) {
      url.searchParams.set("recordsPerPage", request.recordsPerPage.toString());
    }

    const referralArg = buildWithReferralArg(request.filters);

    if (referralArg) {
      url.searchParams.set(referralArg.key, referralArg.value);
    }

    const decodedReferrerArg = buildDecodedReferrerArg(request.filters);

    if (decodedReferrerArg) {
      url.searchParams.set(decodedReferrerArg.key, decodedReferrerArg.value);
    }

    const beginTimestampArg = buildBeginTimestampArg(request.filters);

    if (beginTimestampArg) {
      url.searchParams.set(beginTimestampArg.key, beginTimestampArg.value);
    }

    const endTimestampArg = buildEndTimestampArg(request.filters);

    if (endTimestampArg) {
      url.searchParams.set(endTimestampArg.key, endTimestampArg.value);
    }

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // handle response errors accordingly
    if (!response.ok) {
      // check for a generic errorResponse
      let errorResponse: ErrorResponse | undefined;
      try {
        errorResponse = deserializeErrorResponse(responseData);
      } catch {
        // if errorResponse could not be determined,
        // it means the response includes data
        console.log("Registrar Actions API: handling a known server error.");
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSNode Registrar Actions Failed: ${errorResponse.message}`);
      }
    }

    return deserializeRegistrarActionsResponse(responseData as SerializedRegistrarActionsResponse);
  }

  /**
   * Fetch Name Tokens for requested name.
   *
   * @param request.name - Name for which Name Tokens will be fetched.
   * @returns {NameTokensResponse}
   *
   * @throws if the ENSNode request fails
   * @throws if the ENSNode API returns an error response
   * @throws if the ENSNode response breaks required invariants
   *
   * @example
   * ```ts
   * import {
   *   EnsApiClient,
   * } from "@ensnode/ensnode-sdk";
   * import { namehash } from "viem/ens";
   *
   * const client: EnsApiClient;
   *
   * // get latest name token records from the indexed subregistry based on the requested name
   * const response = await client.nameTokens({
   *   name: "vitalik.eth"
   * });
   *
   * const response = await client.nameTokens({
   *   domainId: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835" // namehash('vitalik.eth')
   * })
   * ```
   */
  async nameTokens(request: NameTokensRequest): Promise<NameTokensResponse> {
    const url = new URL(`/api/name-tokens`, this.options.url);

    if (request.name !== undefined) {
      url.searchParams.set("name", request.name);
    } else if (request.domainId !== undefined) {
      url.searchParams.set("domainId", request.domainId);
    }

    const response = await fetch(url);

    // ENSNode API should always allow parsing a response as JSON object.
    // If for some reason it's not the case, throw an error.
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("Malformed response data: invalid JSON");
    }

    // handle response errors accordingly
    if (!response.ok) {
      // check for a generic errorResponse
      let errorResponse: ErrorResponse | undefined;
      try {
        errorResponse = deserializeErrorResponse(responseData);
      } catch {
        // if errorResponse could not be determined,
        // it means the response includes data
        console.log("Name Tokens API: handling a known server error.");
      }

      // however, if errorResponse was defined,
      // throw an error with the generic server error message
      if (typeof errorResponse !== "undefined") {
        throw new Error(`Fetching ENSNode Name Tokens Failed: ${errorResponse.message}`);
      }
    }

    return deserializedNameTokensResponse(responseData as SerializedNameTokensResponse);
  }
}

/**
 * ENSNode Client
 *
 * @deprecated use {@link EnsApiClient} instead
 */
export class ENSNodeClient extends EnsApiClient {}
