import type { QueryExample } from "./types";

const result = {
  indexingStatus: {
    strategy: "omnichain",
    snapshotTime: 1779795066,
    omnichainSnapshot: {
      chains: {
        1: {
          config: {
            rangeType: "left-bounded",
            startBlock: {
              number: 3327417,
              timestamp: 1489165544,
            },
          },
          chainStatus: "chain-backfill",
          backfillEndBlock: {
            number: 25171597,
            timestamp: 1779703391,
          },
          latestIndexedBlock: {
            number: 21224717,
            timestamp: 1732054691,
          },
        },
        10: {
          config: {
            rangeType: "left-bounded",
            startBlock: {
              number: 110393959,
              timestamp: 1696386695,
            },
          },
          chainStatus: "chain-backfill",
          backfillEndBlock: {
            number: 152052671,
            timestamp: 1779704119,
          },
          latestIndexedBlock: {
            number: 128226309,
            timestamp: 1732051395,
          },
        },
        8453: {
          config: {
            rangeType: "left-bounded",
            startBlock: {
              number: 17522624,
              timestamp: 1721834595,
            },
          },
          chainStatus: "chain-backfill",
          backfillEndBlock: {
            number: 46457386,
            timestamp: 1779704119,
          },
          latestIndexedBlock: {
            number: 22632818,
            timestamp: 1732054983,
          },
        },
        42161: {
          config: {
            rangeType: "left-bounded",
            startBlock: {
              number: 349263357,
              timestamp: 1750406457,
            },
          },
          chainStatus: "chain-queued",
        },
        59144: {
          config: {
            rangeType: "left-bounded",
            startBlock: {
              number: 6682888,
              timestamp: 1720768992,
            },
          },
          chainStatus: "chain-backfill",
          backfillEndBlock: {
            number: 30774477,
            timestamp: 1779703911,
          },
          latestIndexedBlock: {
            number: 12280006,
            timestamp: 1732054967,
          },
        },
        534352: {
          config: {
            rangeType: "left-bounded",
            startBlock: {
              number: 16604272,
              timestamp: 1750406415,
            },
          },
          chainStatus: "chain-queued",
        },
      },
      omnichainStatus: "omnichain-backfill",
      omnichainIndexingCursor: 1732054983,
    },
    slowestChainIndexingCursor: 1732054983,
  },
} as const;

/**
 * Example query for fetching the indexing status snapshot of an ENSDb Writer
 */
export const exampleIndexingStatus = {
  sql: {
    codeSnippet: `SELECT value -> 'indexingStatus' as indexing_status_snapshot
FROM "ensnode".metadata
WHERE ens_indexer_schema_name = 'ensindexer_0'
AND key = 'indexing_metadata_context';
`,
    result: { indexing_status_snapshot: result.indexingStatus },
  },
  sdk: {
    codeSnippet: `import { IndexingMetadataContextStatusCodes } from "@ensnode/ensdb-sdk";

const indexingMetadataContext = await ensDbReader.getIndexingMetadataContext();

if (indexingMetadataContext.statusCode === IndexingMetadataContextStatusCodes.Initialized) {
  const { indexingStatus } = indexingMetadataContext;
  console.log({ indexingStatus });
}`,
    result: { indexingStatus: result.indexingStatus },
  },
} satisfies QueryExample;
