import type { QueryExample } from "./types";

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
        canonical_name: "$2442.eth",
        canonical_node: "0x89c28481de9640822dd25f821e341b0304640b9363d419e10b9d6b99f049fc8c",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x89c28481de9640822dd25f821e341b0304640b9363d419e10b9d6b99f049fc8c",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "$bless.eth",
        canonical_node: "0xfca869315283e0747c929ff17f57d6712cf76b372395eef8b770595d393902ea",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xfca869315283e0747c929ff17f57d6712cf76b372395eef8b770595d393902ea",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "$pauly.eth",
        canonical_node: "0x8254e524ac45f21ce3a3483e52dbedf1aa7bc5d5cff69d4a189df5e369f6eacf",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x8254e524ac45f21ce3a3483e52dbedf1aa7bc5d5cff69d4a189df5e369f6eacf",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "$vince.eth",
        canonical_node: "0x1630be8a50ed7d79c1a5510ca7aaf3d6a483596affcc81c2dbaad17262619dcc",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x1630be8a50ed7d79c1a5510ca7aaf3d6a483596affcc81c2dbaad17262619dcc",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "0000000000000000000000000000000000000000.eth",
        canonical_node: "0xc13733debbac0dd0143dddcbfe8fcede7c3405033357f034d8b0779ad85802e1",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xc13733debbac0dd0143dddcbfe8fcede7c3405033357f034d8b0779ad85802e1",
      },
    ],
  },
  sdk: {
    codeSnippet: `import { and, eq, asc } from "drizzle-orm";

const name = "eth";
const limit = 5;

// Two-step:
// 1) find parent domain,
// 2) query children by parent domain's subregistryId.
const [parentDomain] = await ensDb
  .select({ subregistryId: ensIndexerSchema.domain.subregistryId })
  .from(ensIndexerSchema.domain)
  .where(
    and(
      eq(ensIndexerSchema.domain.canonicalName, name),
      eq(ensIndexerSchema.domain.canonical, true),
    )
);

if (parentDomain?.subregistryId) {
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
        eq(ensIndexerSchema.domain.registryId, parentDomain.subregistryId),
        eq(ensIndexerSchema.domain.canonical, true),
      )
    )
    .orderBy(asc(ensIndexerSchema.domain.canonicalName))
    .limit(limit);

  console.log(subdomains);
}`,
    result: [
      {
        type: "ENSv1Domain",
        canonicalName: "$2442.eth",
        canonicalNode: "0x89c28481de9640822dd25f821e341b0304640b9363d419e10b9d6b99f049fc8c",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x89c28481de9640822dd25f821e341b0304640b9363d419e10b9d6b99f049fc8c",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "$bless.eth",
        canonicalNode: "0xfca869315283e0747c929ff17f57d6712cf76b372395eef8b770595d393902ea",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xfca869315283e0747c929ff17f57d6712cf76b372395eef8b770595d393902ea",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "$pauly.eth",
        canonicalNode: "0x8254e524ac45f21ce3a3483e52dbedf1aa7bc5d5cff69d4a189df5e369f6eacf",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x8254e524ac45f21ce3a3483e52dbedf1aa7bc5d5cff69d4a189df5e369f6eacf",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "$vince.eth",
        canonicalNode: "0x1630be8a50ed7d79c1a5510ca7aaf3d6a483596affcc81c2dbaad17262619dcc",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x1630be8a50ed7d79c1a5510ca7aaf3d6a483596affcc81c2dbaad17262619dcc",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "0000000000000000000000000000000000000000.eth",
        canonicalNode: "0xc13733debbac0dd0143dddcbfe8fcede7c3405033357f034d8b0779ad85802e1",
        id: "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xc13733debbac0dd0143dddcbfe8fcede7c3405033357f034d8b0779ad85802e1",
      },
    ],
  },
} satisfies QueryExample;
