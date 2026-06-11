import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha");

/**
 * Example query for fetching Domains by a canonical name,
 * demonstrating the use of canonical fields to query across both ENSv1 and
 * ENSv2 domains without branching by protocol version.
 */
export const exampleDomainByName = {
  sql: {
    codeSnippet: `SELECT
	id,
	type,
	canonical_name,
	canonical_node,
	owner_id
FROM "ensindexer_0".domains
WHERE canonical_name = 'vitalik.eth'
AND canonical = true;
`,
    result: [
      {
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        type: "ENSv1Domain",
        canonical_name: "vitalik.eth",
        canonical_node: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        owner_id: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq } from "drizzle-orm";

const name = "vitalik.eth";

const domains = await ensDb
  .select({
    id: ensIndexerSchema.domain.id,
    type: ensIndexerSchema.domain.type,
    canonicalName: ensIndexerSchema.domain.canonicalName,
    canonicalNode: ensIndexerSchema.domain.canonicalNode,
    ownerId: ensIndexerSchema.domain.ownerId,
  })
  .from(ensIndexerSchema.domain)
  .where(
    and(
      eq(ensIndexerSchema.domain.canonicalName, name),
      eq(ensIndexerSchema.domain.canonical, true)
    )
  );

console.log(domains);`,
    result: [
      {
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        type: "ENSv1Domain",
        canonicalName: "vitalik.eth",
        canonicalNode: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
        ownerId: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
