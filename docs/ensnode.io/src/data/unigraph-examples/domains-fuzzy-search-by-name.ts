import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha");

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
WHERE __canonical_name_prefix % 'vitalik'
AND canonical = true
ORDER BY name_similarity DESC, LENGTH(canonical_name) ASC
LIMIT 5;
`,
    result: [
      {
        type: "ENSv1Domain",
        canonical_name: "vitalik.id",
        canonical_node: "0xaf3232eb15e694ef5b9107cd2659c9ea75e7c74b59db776ce6be7df6d1131287",
        owner_id: "0x62f4706c61a7b3bf6db74faff7e5e48ac1e004a5",
        name_similarity: 0.72727275,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xaf3232eb15e694ef5b9107cd2659c9ea75e7c74b59db776ce6be7df6d1131287",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "vitalik.eth",
        canonical_node: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        owner_id: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
        name_similarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "🚀vitalik.eth",
        canonical_node: "0x2eaf5dba5efa24eb33e59cfeb1ada63bce28966d82896f8358a5b7e0cd33c0fb",
        owner_id: "0x7dcb9d6e9ecfb03a275dc4864c812dd09a1768a2",
        name_similarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x2eaf5dba5efa24eb33e59cfeb1ada63bce28966d82896f8358a5b7e0cd33c0fb",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "❤vitalik.eth",
        canonical_node: "0xedad39bf146ed24b42e93f8579ae318df3bc925a38d66aef6af87ae91cb1b064",
        owner_id: "0x8cd59e8486a0d57bd95ce467f561f0d13293a0be",
        name_similarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xedad39bf146ed24b42e93f8579ae318df3bc925a38d66aef6af87ae91cb1b064",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "vitalik😂.eth",
        canonical_node: "0x4771060c6bcc732384b8a5969ef56d1b085d47f93bb67af828a1bfcacf00c79a",
        owner_id: "0x4c54c8c65789ed2d77b948f9aa9482daa6b4a582",
        name_similarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x4771060c6bcc732384b8a5969ef56d1b085d47f93bb67af828a1bfcacf00c79a",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq, sql, asc, desc } from "drizzle-orm";

const q = "vitalik";
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
    .orderBy(
      desc(sql\`name_similarity\`),
      asc(sql\`LENGTH(\${ensIndexerSchema.domain.canonicalName})\`),
    )
    .limit(limit);

console.log(domains);`,
    result: [
      {
        type: "ENSv1Domain",
        canonicalName: "vitalik.id",
        canonicalNode: "0xaf3232eb15e694ef5b9107cd2659c9ea75e7c74b59db776ce6be7df6d1131287",
        ownerId: "0x62f4706c61a7b3bf6db74faff7e5e48ac1e004a5",
        nameSimilarity: 0.72727275,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xaf3232eb15e694ef5b9107cd2659c9ea75e7c74b59db776ce6be7df6d1131287",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "vitalik.eth",
        canonicalNode: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        ownerId: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
        nameSimilarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "🚀vitalik.eth",
        canonicalNode: "0x2eaf5dba5efa24eb33e59cfeb1ada63bce28966d82896f8358a5b7e0cd33c0fb",
        ownerId: "0x7dcb9d6e9ecfb03a275dc4864c812dd09a1768a2",
        nameSimilarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x2eaf5dba5efa24eb33e59cfeb1ada63bce28966d82896f8358a5b7e0cd33c0fb",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "❤vitalik.eth",
        canonicalNode: "0xedad39bf146ed24b42e93f8579ae318df3bc925a38d66aef6af87ae91cb1b064",
        ownerId: "0x8cd59e8486a0d57bd95ce467f561f0d13293a0be",
        nameSimilarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xedad39bf146ed24b42e93f8579ae318df3bc925a38d66aef6af87ae91cb1b064",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "vitalik😂.eth",
        canonicalNode: "0x4771060c6bcc732384b8a5969ef56d1b085d47f93bb67af828a1bfcacf00c79a",
        ownerId: "0x4c54c8c65789ed2d77b948f9aa9482daa6b4a582",
        nameSimilarity: 0.6666667,
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x4771060c6bcc732384b8a5969ef56d1b085d47f93bb67af828a1bfcacf00c79a",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
