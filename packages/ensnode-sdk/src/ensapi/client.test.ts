import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ENSNamespaceIds, type Name } from "../ens";
import { PluginName } from "../ensindexer/config/types";
import {
  BlockRefRangeTypeIds,
  ChainIndexingStatusIds,
} from "../indexing-status/chain-indexing-status-snapshot";
import { CrossChainIndexingStrategyIds } from "../indexing-status/cross-chain-indexing-status-snapshot";
import { OmnichainIndexingStatusIds } from "../indexing-status/omnichain-indexing-status-snapshot";
import type { SerializedOmnichainIndexingStatusSnapshotFollowing } from "../indexing-status/serialize/omnichain-indexing-status-snapshot";
import type { ResolverRecordsSelection } from "../resolution";
import { deserializeEnsApiIndexingStatusResponse } from "./api/indexing-status/deserialize";
import {
  type EnsApiIndexingStatusResponse,
  EnsApiIndexingStatusResponseCodes,
} from "./api/indexing-status/response";
import { serializeEnsApiIndexingStatusResponse } from "./api/indexing-status/serialize";
import type { SerializedEnsApiIndexingStatusResponseOk } from "./api/indexing-status/serialized-response";
import type {
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesResponse,
} from "./api/resolution/types";
import type { ErrorResponse } from "./api/shared/errors/response";
import { EnsApiClient } from "./client";
import { ClientError } from "./client-error";
import { deserializeEnsApiPublicConfig } from "./config/deserialize";
import type { SerializedEnsApiPublicConfig } from "./config/serialized-types";
import { DEFAULT_ENSNODE_API_URL_MAINNET, getDefaultEnsNodeUrl } from "./deployments";

const EXAMPLE_NAME: Name = "example.eth";
const EXAMPLE_ADDRESS: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const EXAMPLE_SELECTION = {
  addresses: [60],
  texts: ["avatar", "com.twitter"],
} as const satisfies ResolverRecordsSelection;

const EXAMPLE_RECORDS_RESPONSE = {
  addresses: { 60: EXAMPLE_ADDRESS },
  texts: {
    avatar: "https://example.com/image.jpg",
    "com.twitter": "example",
  },
};

const EXAMPLE_PRIMARY_NAME_RESPONSE = {
  name: EXAMPLE_NAME,
  accelerationRequested: false,
  accelerationAttempted: false,
} satisfies ResolvePrimaryNameResponse;

const EXAMPLE_PRIMARY_NAMES_RESPONSE = {
  names: { 1: EXAMPLE_NAME },
  accelerationRequested: false,
  accelerationAttempted: false,
} satisfies ResolvePrimaryNamesResponse;

const EXAMPLE_ERROR_RESPONSE: ErrorResponse = { message: "error" };

const EXAMPLE_CONFIG_RESPONSE = {
  version: "0.32.0",
  theGraphFallback: {
    canFallback: false,
    reason: "no-api-key",
  },
  ensIndexerPublicConfig: {
    labelSet: {
      labelSetId: "subgraph",
      labelSetVersion: 0,
    },
    indexedChainIds: [1, 8453, 59144, 10, 42161, 534352],
    databaseSchemaName: "alphaSchema0.31.0",
    isSubgraphCompatible: false,
    namespace: "mainnet",
    plugins: [
      PluginName.Subgraph,
      PluginName.Basenames,
      PluginName.Lineanames,
      PluginName.ThreeDNS,
      PluginName.ProtocolAcceleration,
      PluginName.Registrars,
    ],
    versionInfo: {
      nodejs: "22.18.0",
      ponder: "0.11.43",
      ensDb: "0.32.0",
      ensIndexer: "0.32.0",
      ensNormalize: "1.11.1",
      ensRainbow: "0.31.0",
      ensRainbowSchema: 2,
    },
  },
} satisfies SerializedEnsApiPublicConfig;

const EXAMPLE_INDEXING_STATUS_BACKFILL_RESPONSE = deserializeEnsApiIndexingStatusResponse({
  realtimeProjection: {
    projectedAt: 1755182604,
    worstCaseDistance: 1013,
    snapshot: {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 1755181591,
      snapshotTime: 1755182591,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: {
          "1": {
            chainStatus: ChainIndexingStatusIds.Backfill,
            config: {
              blockRangeType: BlockRefRangeTypeIds.Indefinite,
              startBlock: {
                timestamp: 1489165544,
                number: 3327417,
              },
            },
            latestIndexedBlock: {
              timestamp: 1755181591,
              number: 3791243,
            },
            backfillEndBlock: {
              timestamp: 1755182591,
              number: 23139951,
            },
          },
          "8453": {
            chainStatus: ChainIndexingStatusIds.Queued,
            config: {
              blockRangeType: BlockRefRangeTypeIds.Indefinite,
              startBlock: {
                timestamp: 1755181691,
                number: 17571480,
              },
            },
          },
        },
        omnichainIndexingCursor: 1755181591,
      },
    },
  },

  responseCode: EnsApiIndexingStatusResponseCodes.Ok,
} satisfies SerializedEnsApiIndexingStatusResponseOk);

const _EXAMPLE_INDEXING_STATUS_FOLLOWING_RESPONSE: EnsApiIndexingStatusResponse =
  deserializeEnsApiIndexingStatusResponse({
    realtimeProjection: {
      projectedAt: 1_499_456_547,
      worstCaseDistance: 30,
      snapshot: {
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: 1_499_456_517,
        snapshotTime: 1_499_456_537,

        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Following,
          chains: {
            "1": {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                blockRangeType: BlockRefRangeTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1_496_123_537,
                  number: 23_327_417,
                },
              },
              latestIndexedBlock: {
                timestamp: 1_499_456_517,
                number: 23_791_243,
              },
              latestKnownBlock: {
                timestamp: 1_499_456_527,
                number: 23_791_247,
              },
            },
            "8453": {
              chainStatus: ChainIndexingStatusIds.Backfill,
              config: {
                blockRangeType: BlockRefRangeTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1_484_015_544,
                  number: 17_571_480,
                },
              },
              latestIndexedBlock: {
                timestamp: 1_499_456_516,
                number: 17_599_999,
              },
              backfillEndBlock: {
                timestamp: 1_499_456_529,
                number: 18_000_000,
              },
            },
          },
          omnichainIndexingCursor: 1_499_456_517,
        } satisfies SerializedOmnichainIndexingStatusSnapshotFollowing,
      },
    },

    responseCode: EnsApiIndexingStatusResponseCodes.Ok,
  });

// Mock fetch globally (auto-restored by vitest)
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("EnsApiClient", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("constructor and options", () => {
    it("should use default options when none provided", () => {
      const client = new EnsApiClient();
      const options = client.getOptions();

      expect(options).toEqual({ url: getDefaultEnsNodeUrl(ENSNamespaceIds.Mainnet) });
    });

    it("should merge provided options with defaults", () => {
      const customUrl = new URL("https://custom.api.com");
      const client = new EnsApiClient({ url: customUrl });
      const options = client.getOptions();

      expect(options).toEqual({ url: customUrl });
    });

    it("should return frozen options object", () => {
      const client = new EnsApiClient();
      const options = client.getOptions();

      expect(Object.isFrozen(options)).toBe(true);
    });
  });

  describe("resolveRecords", () => {
    // TODO: integrate with default-case expectations from resolution api and test behavior
    it("should handle address and text selections", async () => {
      const mockResponse = { records: EXAMPLE_RECORDS_RESPONSE };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const client = new EnsApiClient();
      const response = await client.resolveRecords(EXAMPLE_NAME, EXAMPLE_SELECTION);

      const expectedUrl = new URL(
        `/api/resolve/records/${EXAMPLE_NAME}`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("addresses", EXAMPLE_SELECTION.addresses.join(","));
      expectedUrl.searchParams.set("texts", EXAMPLE_SELECTION.texts.join(","));

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });

    it("should include trace if specified", async () => {
      const mockResponse = { records: EXAMPLE_RECORDS_RESPONSE, trace: [] };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const client = new EnsApiClient();
      const response = await client.resolveRecords(EXAMPLE_NAME, EXAMPLE_SELECTION, {
        trace: true,
      });

      const expectedUrl = new URL(
        `/api/resolve/records/${EXAMPLE_NAME}`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("addresses", EXAMPLE_SELECTION.addresses.join(","));
      expectedUrl.searchParams.set("texts", EXAMPLE_SELECTION.texts.join(","));
      expectedUrl.searchParams.set("trace", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      const client = new EnsApiClient();
      await expect(client.resolveRecords(EXAMPLE_NAME, EXAMPLE_SELECTION)).rejects.toThrowError(
        ClientError,
      );
    });
  });

  describe("resolvePrimaryName", () => {
    it("should make correct API call for primary name resolution", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EXAMPLE_PRIMARY_NAME_RESPONSE,
      });

      const client = new EnsApiClient();
      const response = await client.resolvePrimaryName(EXAMPLE_ADDRESS, 1);

      const expectedUrl = new URL(
        `/api/resolve/primary-name/${EXAMPLE_ADDRESS}/1`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(EXAMPLE_PRIMARY_NAME_RESPONSE);
    });

    it("should include trace if specified", async () => {
      const mockResponse = { name: EXAMPLE_NAME, trace: [] };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const client = new EnsApiClient();
      const response = await client.resolvePrimaryName(EXAMPLE_ADDRESS, 1, { trace: true });

      const expectedUrl = new URL(
        `/api/resolve/primary-name/${EXAMPLE_ADDRESS}/1`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("trace", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });

    it("should include accelerate=true if specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EXAMPLE_PRIMARY_NAME_RESPONSE,
      });

      const client = new EnsApiClient();
      await client.resolvePrimaryName(EXAMPLE_ADDRESS, 1, { accelerate: true });

      const expectedUrl = new URL(
        `/api/resolve/primary-name/${EXAMPLE_ADDRESS}/1`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("accelerate", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      const client = new EnsApiClient();
      await expect(client.resolvePrimaryName(EXAMPLE_ADDRESS, 1)).rejects.toThrowError(ClientError);
    });
  });

  describe("resolvePrimaryNames", () => {
    it("should call the correct endpoint and return names", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EXAMPLE_PRIMARY_NAMES_RESPONSE,
      });

      const client = new EnsApiClient();
      const response = await client.resolvePrimaryNames(EXAMPLE_ADDRESS);

      const expectedUrl = new URL(
        `/api/resolve/primary-names/${EXAMPLE_ADDRESS}`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(EXAMPLE_PRIMARY_NAMES_RESPONSE);
    });

    it("should include chainIds if specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EXAMPLE_PRIMARY_NAMES_RESPONSE,
      });

      const client = new EnsApiClient();
      await client.resolvePrimaryNames(EXAMPLE_ADDRESS, { chainIds: [1, 10] });

      const expectedUrl = new URL(
        `/api/resolve/primary-names/${EXAMPLE_ADDRESS}`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("chainIds", "1,10");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should include trace if specified", async () => {
      const mockResponse = { ...EXAMPLE_PRIMARY_NAMES_RESPONSE, trace: [] };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const client = new EnsApiClient();
      const response = await client.resolvePrimaryNames(EXAMPLE_ADDRESS, { trace: true });

      const expectedUrl = new URL(
        `/api/resolve/primary-names/${EXAMPLE_ADDRESS}`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("trace", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response).toEqual(mockResponse);
    });

    it("should include accelerate=true if specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => EXAMPLE_PRIMARY_NAMES_RESPONSE,
      });

      const client = new EnsApiClient();
      await client.resolvePrimaryNames(EXAMPLE_ADDRESS, { accelerate: true });

      const expectedUrl = new URL(
        `/api/resolve/primary-names/${EXAMPLE_ADDRESS}`,
        DEFAULT_ENSNODE_API_URL_MAINNET,
      );
      expectedUrl.searchParams.set("accelerate", "true");

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      const client = new EnsApiClient();
      await expect(client.resolvePrimaryNames(EXAMPLE_ADDRESS)).rejects.toThrowError(ClientError);
    });
  });

  describe("Config API", () => {
    it("can fetch config object successfully", async () => {
      // arrange
      const requestUrl = new URL(`/api/config`, DEFAULT_ENSNODE_API_URL_MAINNET);
      const serializedMockedResponse = EXAMPLE_CONFIG_RESPONSE;
      const mockedResponse = deserializeEnsApiPublicConfig(serializedMockedResponse);
      const client = new EnsApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serializedMockedResponse,
      });

      // act & assert
      await expect(client.config()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });

    it("should throw error when API returns error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      const client = new EnsApiClient();

      await expect(client.config()).rejects.toThrow(/Fetching ENSApi Config Failed/i);
    });
  });

  describe("Indexing Status API", () => {
    it("can fetch overall indexing 'backfill' status object successfully", async () => {
      // arrange
      const requestUrl = new URL(`/api/indexing-status`, DEFAULT_ENSNODE_API_URL_MAINNET);
      const mockedResponse = EXAMPLE_INDEXING_STATUS_BACKFILL_RESPONSE;

      const client = new EnsApiClient();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serializeEnsApiIndexingStatusResponse(mockedResponse),
      });

      // act & assert
      await expect(client.indexingStatus()).resolves.toStrictEqual(mockedResponse);
      expect(mockFetch).toHaveBeenCalledWith(requestUrl);
    });

    it("should throw error when API returns error other than 503 error", async () => {
      // arrange
      const client = new EnsApiClient();

      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => EXAMPLE_ERROR_RESPONSE });

      // act & assert
      await expect(client.indexingStatus()).rejects.toThrow(
        /Fetching ENSApi Indexing Status Failed/i,
      );
    });
  });
});
