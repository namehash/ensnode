import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("V2 Sepolia");

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
WHERE canonical_name = 'eth'
AND canonical = true;
`,
    result: [
      {
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        type: "ENSv1Domain",
        canonical_name: "eth",
        canonical_node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        owner_id: "0xa51c9e6efe589407c72984e93b45e35a71a398ec",
      },
      {
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-35894389512221139346028120028875095598761990588366713962827482865183915769856",
        type: "ENSv2Domain",
        canonical_name: "eth",
        canonical_node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq } from "drizzle-orm";

const name = "eth";

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
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        type: "ENSv1Domain",
        canonicalName: "eth",
        canonicalNode: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        ownerId: "0xa51c9e6efe589407c72984e93b45e35a71a398ec",
      },
      {
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-35894389512221139346028120028875095598761990588366713962827482865183915769856",
        type: "ENSv2Domain",
        canonicalName: "eth",
        canonicalNode: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
