import { describe, expect, it } from "vitest";

import { ChainIndexingStatusIds } from "../../indexing-status/chain-indexing-status-snapshot";
import { buildCrossChainIndexingStatusSnapshotOmnichain } from "../../indexing-status/cross-chain-indexing-status-snapshot";
import { OmnichainIndexingStatusIds } from "../../indexing-status/omnichain-indexing-status-snapshot";
import { RangeTypeIds } from "../../shared/blockrange";
import { buildEnsIndexerStackInfo } from "../../stack-info/ensindexer-stack-info";
import { deserializeIndexingMetadataContext } from "./deserialize/indexing-metadata-context";
import {
  buildIndexingMetadataContextInitialized,
  buildIndexingMetadataContextUninitialized,
  IndexingMetadataContextStatusCodes,
} from "./indexing-metadata-context";
import { serializeIndexingMetadataContext } from "./serialize/indexing-metadata-context";
import { validateIndexingMetadataContextInitialized } from "./validate/indexing-metadata-context";

function makeMinimalIndexingStatus() {
  const earlierBlock = { timestamp: 1672531199, number: 1024 };
  const laterBlock = { timestamp: 1672531200, number: 1025 };
  const snapshotTime = laterBlock.timestamp;

  return buildCrossChainIndexingStatusSnapshotOmnichain(
    {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      chains: new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            config: { rangeType: RangeTypeIds.LeftBounded, startBlock: earlierBlock },
            latestIndexedBlock: earlierBlock,
            latestKnownBlock: laterBlock,
          },
        ],
      ]),
      omnichainIndexingCursor: earlierBlock.timestamp,
    },
    snapshotTime,
  );
}

function makeMinimalStackInfo() {
  return buildEnsIndexerStackInfo(
    { versionInfo: { postgresql: "17.4" } },
    {
      namespace: "mainnet",
      clientLabelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
      ensIndexerSchemaName: "test_schema",
      ensRainbowPublicConfig: {
        serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
        versionInfo: { ensRainbow: "1.0.0" },
      },
      indexedChainIds: new Set([1]),
      isSubgraphCompatible: true,
      plugins: ["subgraph"],
      versionInfo: {
        ponder: "0.11.25",
        ensDb: "0.32.0",
        ensIndexer: "0.32.0",
        ensNormalize: "1.11.1",
      },
    },
    {
      serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
      versionInfo: { ensRainbow: "1.0.0" },
    },
  );
}

describe("buildIndexingMetadataContextUninitialized", () => {
  it('returns an object with statusCode "uninitialized"', () => {
    const result = buildIndexingMetadataContextUninitialized();

    expect(result).toStrictEqual({
      statusCode: IndexingMetadataContextStatusCodes.Uninitialized,
    });
  });
});

describe("buildIndexingMetadataContextInitialized", () => {
  it("constructs a valid initialized context from valid inputs", () => {
    const indexingStatus = makeMinimalIndexingStatus();
    const stackInfo = makeMinimalStackInfo();

    const result = buildIndexingMetadataContextInitialized(indexingStatus, stackInfo);

    expect(result.statusCode).toBe(IndexingMetadataContextStatusCodes.Initialized);
    expect(result.indexingStatus).toStrictEqual(indexingStatus);
    expect(result.stackInfo).toStrictEqual(stackInfo);
  });

  it("throws when indexingStatus is invalid", () => {
    const stackInfo = makeMinimalStackInfo();

    expect(() => buildIndexingMetadataContextInitialized({} as any, stackInfo)).toThrow();
  });

  it("throws when stackInfo is invalid", () => {
    const indexingStatus = makeMinimalIndexingStatus();

    expect(() => buildIndexingMetadataContextInitialized(indexingStatus, {} as any)).toThrow();
  });
});

describe("serializeIndexingMetadataContext / deserializeIndexingMetadataContext roundtrip", () => {
  it("roundtrips an uninitialized context", () => {
    const context = buildIndexingMetadataContextUninitialized();
    const serialized = serializeIndexingMetadataContext(context);
    const deserialized = deserializeIndexingMetadataContext(serialized);

    expect(deserialized).toStrictEqual(context);
  });

  it("roundtrips an initialized context", () => {
    const context = buildIndexingMetadataContextInitialized(
      makeMinimalIndexingStatus(),
      makeMinimalStackInfo(),
    );
    const serialized = serializeIndexingMetadataContext(context);
    const deserialized = deserializeIndexingMetadataContext(serialized);

    expect(deserialized).toStrictEqual(context);
  });
});

describe("deserializeIndexingMetadataContext", () => {
  it("rejects malformed serialized data (missing statusCode)", () => {
    expect(() => deserializeIndexingMetadataContext({} as any)).toThrow();
  });

  it("rejects serialized data with unrecognized statusCode", () => {
    expect(() => deserializeIndexingMetadataContext({ statusCode: "bogus" } as any)).toThrow();
  });

  it("rejects non-object input", () => {
    expect(() => deserializeIndexingMetadataContext(null as any)).toThrow();
    expect(() => deserializeIndexingMetadataContext("not an object" as any)).toThrow();
  });
});

describe("validateIndexingMetadataContextInitialized", () => {
  it("rejects an uninitialized statusCode", () => {
    expect(() =>
      validateIndexingMetadataContextInitialized({
        statusCode: IndexingMetadataContextStatusCodes.Uninitialized,
      } as any),
    ).toThrow();
  });
});
