import type { QueryExample } from "./types";

/**
 * Example query for fetching Domains by a fuzzy search on their canonical name.
 */
export const exampleDomainsFuzzySearchByName = {
  sql: {
    codeSnippet: `SELECT
  type,
  canonical_name,
  canonical_node,
  owner_id,
  similarity(canonical_name, 'vitalik') as name_similarity,
  id
FROM "ensindexer_0".domains
-- Use the pg_trgm similarity operator (%) for fuzzy matching on canonical_name
WHERE canonical_name % 'vitalik'
AND canonical = true
ORDER BY name_similarity DESC
LIMIT 5;
`,
    result: [
      {
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        type: "ENSv1Domain",
        canonical_name: "vitalik.eth",
        canonical_node: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        owner_id: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        name_similarity: 0.6666667,
      },
      {
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x278adcf079fceb551531f1593deae8891d83bf4708b935d54eda7f8db51ce797",
        type: "ENSv1Domain",
        canonical_name: "vitalikkk.eth",
        canonical_node: "0x278adcf079fceb551531f1593deae8891d83bf4708b935d54eda7f8db51ce797",
        owner_id: "0x588f6b3169f60176c1143f8bab47bcf3deebecdc",
        name_similarity: 0.46666667,
      },
      {
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x55e83f7d37d7cf1f87c40a6bd5fc8e62e8898b327c5a09776596f6efe547349a",
        type: "ENSv1Domain",
        canonical_name: "vitalik.taars.eth",
        canonical_node: "0x55e83f7d37d7cf1f87c40a6bd5fc8e62e8898b327c5a09776596f6efe547349a",
        owner_id: "0x5a09e3ec3efdd91205cbb097142a4f4dcefc7f02",
        name_similarity: 0.44444445,
      },
      {
        id: "84532-0x1493b2567056c2181630115660963e13a8e32735-0x97fa42e69feb1d407361108d79ddad705707a16392d7823f8b21b44dabfc4a9d",
        type: "ENSv1Domain",
        canonical_name: "vitalik.basetest.eth",
        canonical_node: "0x97fa42e69feb1d407361108d79ddad705707a16392d7823f8b21b44dabfc4a9d",
        owner_id: "0x15378e401f9c3243639c7c3250be0f396a758e40",
        name_similarity: 0.3809524,
      },
      {
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x117e485acf1ebff586d1382b7689201ce23f7142ae92f4c397849f4b01e6a1cc",
        type: "ENSv1Domain",
        canonical_name: "vitalikbuterin.eth",
        canonical_node: "0x117e485acf1ebff586d1382b7689201ce23f7142ae92f4c397849f4b01e6a1cc",
        owner_id: "0x16ecc228f185b084cb884be2d65544f5ca4dd761",
        name_similarity: 0.35,
      },
    ],
  },
  sdk: {
    codeSnippet: `import { and, asc, eq, sql } from "drizzle-orm";

const q = "vitalik";
const limit = 5;

const domains = await ensDb
  .select({
    canonicalName: ensIndexerSchema.domain.canonicalName,
    canonicalDepth: ensIndexerSchema.domain.canonicalDepth,
    ownerId: ensIndexerSchema.domain.ownerId,
    nameSimilarity: sql<number>\`similarity(\${ensIndexerSchema.domain.canonicalName}, \${q})\`.as(
      "name_similarity",
    ),
    id: ensIndexerSchema.domain.id,
  })
  .from(ensIndexerSchema.domain)
  .where(
    and(
      sql\`\${ensIndexerSchema.domain.canonicalName} % \${q}\`,
      eq(ensIndexerSchema.domain.canonical, true),
    ),
  )
  .orderBy(sql\`name_similarity DESC\`)
  .limit(limit);

console.log(domains);`,
    result: [
      {
        canonicalName: "vitalik.eth",
        canonicalDepth: 2,
        ownerId: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        nameSimilarity: 0.6666667,
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        canonicalName: "vitalikkk.eth",
        canonicalDepth: 2,
        ownerId: "0x588f6b3169f60176c1143f8bab47bcf3deebecdc",
        nameSimilarity: 0.46666667,
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x278adcf079fceb551531f1593deae8891d83bf4708b935d54eda7f8db51ce797",
      },
      {
        canonicalName: "vitalik.taars.eth",
        canonicalDepth: 3,
        ownerId: "0x5a09e3ec3efdd91205cbb097142a4f4dcefc7f02",
        nameSimilarity: 0.44444445,
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x55e83f7d37d7cf1f87c40a6bd5fc8e62e8898b327c5a09776596f6efe547349a",
      },
      {
        canonicalName: "vitalik.basetest.eth",
        canonicalDepth: 3,
        ownerId: "0x15378e401f9c3243639c7c3250be0f396a758e40",
        nameSimilarity: 0.3809524,
        id: "84532-0x1493b2567056c2181630115660963e13a8e32735-0x97fa42e69feb1d407361108d79ddad705707a16392d7823f8b21b44dabfc4a9d",
      },
      {
        canonicalName: "vitalikbuterin.eth",
        canonicalDepth: 2,
        ownerId: "0x16ecc228f185b084cb884be2d65544f5ca4dd761",
        nameSimilarity: 0.35,
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x117e485acf1ebff586d1382b7689201ce23f7142ae92f4c397849f4b01e6a1cc",
      },
    ],
  },
} satisfies QueryExample;
