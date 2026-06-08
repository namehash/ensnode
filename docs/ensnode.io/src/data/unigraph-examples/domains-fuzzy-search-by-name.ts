import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("V2 Sepolia");

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
    similarity(canonical_name, 'reverse') as name_similarity,
    id
FROM "ensindexer_0".domains
WHERE __canonical_name_prefix % 'reverse'
AND canonical = true
ORDER BY name_similarity DESC
LIMIT 5;
`,
    result: [
      {
        type: "ENSv1Domain",
        canonical_name: "reverse",
        canonical_node: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
        name_similarity: 1,
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "reverse",
        canonical_node: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
        name_similarity: 1,
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-100753657518907091865523951670693454610893379027273088370152078482136467767296",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "addr.reverse",
        canonical_node: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2",
        owner_id: "0x26e5e80e8f36607ef401443fb34eea363c86e8f7",
        name_similarity: 0.61538464,
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq, sql } from "drizzle-orm";

const q = "reverse";
const limit = 5;

const domains = await ensDb
  .select({
      type: ensIndexerSchema.domain.type,
      canonicalName: ensIndexerSchema.domain.canonicalName,
      canonicalNode: ensIndexerSchema.domain.canonicalNode,
      ownerId: ensIndexerSchema.domain.ownerId,
      nameSimilarity: sql<number>\`similarity(\${ensIndexerSchema.domain.canonicalName}, \${q})\`.as(
        "name_similarity",
      ),
      id: ensIndexerSchema.domain.id,
    })
    .from(ensIndexerSchema.domain)
    .where(
      and(
        sql\`\${ensIndexerSchema.domain.__canonicalNamePrefix} % \${q}\`,
        eq(ensIndexerSchema.domain.canonical, true),
      ),
    )
    .orderBy(sql\`name_similarity DESC\`)
    .limit(limit);

console.log(domains);`,
    result: [
      {
        type: "ENSv1Domain",
        canonicalName: "reverse",
        canonicalNode: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
        nameSimilarity: 1,
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "reverse",
        canonicalNode: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
        nameSimilarity: 1,
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-100753657518907091865523951670693454610893379027273088370152078482136467767296",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "addr.reverse",
        canonicalNode: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2",
        ownerId: "0x26e5e80e8f36607ef401443fb34eea363c86e8f7",
        nameSimilarity: 0.61538464,
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
