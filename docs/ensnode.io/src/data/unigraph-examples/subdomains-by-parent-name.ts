import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("V2 Sepolia");

/**
 * Example query for fetching subdomains by their canonical name of the parent domain.
 */
export const exampleSubdomainsByParentName = {
  sql: {
    codeSnippet: `WITH parent AS (
  SELECT subregistry_id
  FROM "ensindexer_0".domains
  WHERE canonical_name = 'eth'
  AND canonical = true
)
SELECT
  d.type,
  d.canonical_name,
  d.canonical_node,
  d.id
FROM "ensindexer_0".domains d
JOIN parent p ON d.registry_id = p.subregistry_id
WHERE d.canonical = true
ORDER BY d.canonical_name
LIMIT 5;
`,
    result: [
      {
        type: "ENSv1Domain",
        canonical_name: "[52602a50858115661619fb28cf543ee766c182e0be6743c72d5bd674b3d12686].eth",
        canonical_node: "0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "[d90db363b8bc1371f7d738d264ff7294bfc5636f907c467adf68321a3c6d8188].eth",
        canonical_node: "0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "katrenpadu.eth",
        canonical_node: "0xf8ae81127bcd7ff99828b3dbd982a943d6dd961ee3f1a6ca707aa0eea913328e",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-112554048520345018269255786667391470421317806528110367240542760381540064034816",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "roppp.eth",
        canonical_node: "0x39095c3dfb872d6441c95547f88591e7fb97014eef30cabe3df12a9b2a64dbe8",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-88275407146030613359050872632052369891139576190404928761656352489271755538432",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "sfmpfv44d0mig.eth",
        canonical_node: "0x9b365136312d7ee6e232e3c98e459bc8667ec818c47fbbc55bb5e23d0a21e8cc",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x9b365136312d7ee6e232e3c98e459bc8667ec818c47fbbc55bb5e23d0a21e8cc",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq, inArray, asc } from "drizzle-orm";

const name = "eth";
const limit = 5;

// Two-step:
// 1) find parent domains
// 2) query children by each parent domain's subregistryId.
const parentDomains = await ensDb
  .select({ subregistryId: ensIndexerSchema.domain.subregistryId })
  .from(ensIndexerSchema.domain)
  .where(
    and(
      eq(ensIndexerSchema.domain.canonicalName, name),
      eq(ensIndexerSchema.domain.canonical, true),
    ),
  );

if (parentDomains.length > 0) {
  const subdomains = await ensDb
    .select({
      type: ensIndexerSchema.domain.type,
      canonicalName: ensIndexerSchema.domain.canonicalName,
      canonicalNode: ensIndexerSchema.domain.canonicalNode,
      id: ensIndexerSchema.domain.id,
    })
    .from(ensIndexerSchema.domain)
    .where(
      and(
        inArray(
          ensIndexerSchema.domain.registryId,
          parentDomains.map((d) => d.subregistryId),
        ),
        eq(ensIndexerSchema.domain.canonical, true),
      ),
    )
    .orderBy(asc(ensIndexerSchema.domain.__canonicalNamePrefix))
    .limit(limit);

  console.log(subdomains);
}`,
    result: [
      {
        type: "ENSv1Domain",
        canonicalName: "[52602a50858115661619fb28cf543ee766c182e0be6743c72d5bd674b3d12686].eth",
        canonicalNode: "0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "[d90db363b8bc1371f7d738d264ff7294bfc5636f907c467adf68321a3c6d8188].eth",
        canonicalNode: "0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "katrenpadu.eth",
        canonicalNode: "0xf8ae81127bcd7ff99828b3dbd982a943d6dd961ee3f1a6ca707aa0eea913328e",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-112554048520345018269255786667391470421317806528110367240542760381540064034816",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "roppp.eth",
        canonicalNode: "0x39095c3dfb872d6441c95547f88591e7fb97014eef30cabe3df12a9b2a64dbe8",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-88275407146030613359050872632052369891139576190404928761656352489271755538432",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "sfmpfv44d0mig.eth",
        canonicalNode: "0x9b365136312d7ee6e232e3c98e459bc8667ec818c47fbbc55bb5e23d0a21e8cc",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-30078755955643454526763071980293195785165410039216352470119925106082295316480",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
