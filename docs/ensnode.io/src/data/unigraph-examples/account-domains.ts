import type { QueryExample } from "./types";

/**
 * Example query for fetching Domains by their owner's address,
 * demonstrating the use of canonical fields to query across both ENSv1 and
 * ENSv2 domains without branching by protocol version.
 */
export const exampleAccountDomains = {
  sql: {
    codeSnippet: `SELECT
  d.type,
  d.canonical_name,
  d.canonical_node,
  d.id,
  d.owner_id
FROM "ensindexer_0".domains d
WHERE d.canonical = true
AND d.owner_id = '0xffffffffff52d316b7bd028358089bc8066b8f80'
ORDER BY d.canonical_name
LIMIT 10;`,
    result: [
      {
        type: "ENSv1Domain",
        canonical_name:
          "[3ad05e2a5922916840bc1e5e6039f00b27cbabf8d0428abce062aa2011307374].addr.reverse",
        canonical_node: "0xd3947f90d04d7f41f973f09ad7dbdb34cb7463359369e6cf1663bbf928d66e53",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xd3947f90d04d7f41f973f09ad7dbdb34cb7463359369e6cf1663bbf928d66e53",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "[52602a50858115661619fb28cf543ee766c182e0be6743c72d5bd674b3d12686].eth",
        canonical_node: "0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonical_name:
          "[8268685e13ae6bbfa54901f2954f9fcf80839ffa102fe7146b930623ce9bd7f0].addr.reverse",
        canonical_node: "0x21c356e778799bfddf59a5683c04f6b08710d7c198fef466cc697563b2210785",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x21c356e778799bfddf59a5683c04f6b08710d7c198fef466cc697563b2210785",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "[d90db363b8bc1371f7d738d264ff7294bfc5636f907c467adf68321a3c6d8188].eth",
        canonical_node: "0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonical_name:
          "[d99fc3d8237200c7122431276a337421cf793f51276873df5a54cc482fdbe685].addr.reverse",
        canonical_node: "0x4fc87044c0adc4a0c996b9dafe3a4889e72fe0745fc76f18151b81ed73582218",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x4fc87044c0adc4a0c996b9dafe3a4889e72fe0745fc76f18151b81ed73582218",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "eth",
        canonical_node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-35894389512221139346028120028875095598761990588366713962827482865183915769856",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "reverse",
        canonical_node: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-100753657518907091865523951670693454610893379027273088370152078482136467767296",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "reverse",
        canonical_node: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "sfmpfv44d0mig.eth",
        canonical_node: "0x9b365136312d7ee6e232e3c98e459bc8667ec818c47fbbc55bb5e23d0a21e8cc",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-30078755955643454526763071980293195785165410039216352470119925106082295316480",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonical_name: "sfmpfvtoicv2ok.eth",
        canonical_node: "0x7d0c27336cf9d51c3fc8f29ef4ef69df9cd4a8ec983e3e17d457a8de6013f3c5",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-49509597771493908415463190501045916291230588437784211605615168713991762477056",
        owner_id: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
    ],
  },
  sdk: {
    codeSnippet: `import { and, eq, asc } from "drizzle-orm";

const owner = "0xffffffffff52d316b7bd028358089bc8066b8f80";
const limit = 10;
  
const accountDomains = await ensDb
  .select({
    canonicalName: ensIndexerSchema.domain.canonicalName,
    canonicalNode: ensIndexerSchema.domain.canonicalNode,
    type: ensIndexerSchema.domain.type,
    id: ensIndexerSchema.domain.id,
    ownerId: ensIndexerSchema.domain.ownerId,
  })
  .from(ensIndexerSchema.domain)
  .where(
    and(
      eq(ensIndexerSchema.domain.ownerId, owner),
      eq(ensIndexerSchema.domain.canonical, true),
    ),
  )
  .orderBy(asc(ensIndexerSchema.domain.canonicalName))
  .limit(limit);

console.log(accountDomains);`,
    result: [
      {
        type: "ENSv1Domain",
        canonicalName:
          "[3ad05e2a5922916840bc1e5e6039f00b27cbabf8d0428abce062aa2011307374].addr.reverse",
        canonicalNode: "0xd3947f90d04d7f41f973f09ad7dbdb34cb7463359369e6cf1663bbf928d66e53",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xd3947f90d04d7f41f973f09ad7dbdb34cb7463359369e6cf1663bbf928d66e53",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "[52602a50858115661619fb28cf543ee766c182e0be6743c72d5bd674b3d12686].eth",
        canonicalNode: "0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xe91ce3506cd47457c2b3f04c2736875ca1d17ed74bf1a328a7e64cca5ae8c94b",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonicalName:
          "[8268685e13ae6bbfa54901f2954f9fcf80839ffa102fe7146b930623ce9bd7f0].addr.reverse",
        canonicalNode: "0x21c356e778799bfddf59a5683c04f6b08710d7c198fef466cc697563b2210785",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x21c356e778799bfddf59a5683c04f6b08710d7c198fef466cc697563b2210785",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "[d90db363b8bc1371f7d738d264ff7294bfc5636f907c467adf68321a3c6d8188].eth",
        canonicalNode: "0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x08c0f01c419a8971af6b3eefe2a8bba1556cccf1163df60b1cdbcab632c8ab48",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonicalName:
          "[d99fc3d8237200c7122431276a337421cf793f51276873df5a54cc482fdbe685].addr.reverse",
        canonicalNode: "0x4fc87044c0adc4a0c996b9dafe3a4889e72fe0745fc76f18151b81ed73582218",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0x4fc87044c0adc4a0c996b9dafe3a4889e72fe0745fc76f18151b81ed73582218",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "eth",
        canonicalNode: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-35894389512221139346028120028875095598761990588366713962827482865183915769856",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "reverse",
        canonicalNode: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        id: "11155111-0x835f0b284e78cd3f358bcf6cba3b53809f09b79e-100753657518907091865523951670693454610893379027273088370152078482136467767296",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "reverse",
        canonicalNode: "0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        id: "11155111-0xb6fb46e1458915dd828633d91e1df8e4c3f2d4dd-0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "sfmpfv44d0mig.eth",
        canonicalNode: "0x9b365136312d7ee6e232e3c98e459bc8667ec818c47fbbc55bb5e23d0a21e8cc",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-30078755955643454526763071980293195785165410039216352470119925106082295316480",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
      {
        type: "ENSv2Domain",
        canonicalName: "sfmpfvtoicv2ok.eth",
        canonicalNode: "0x7d0c27336cf9d51c3fc8f29ef4ef69df9cd4a8ec983e3e17d457a8de6013f3c5",
        id: "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-49509597771493908415463190501045916291230588437784211605615168713991762477056",
        ownerId: "0xffffffffff52d316b7bd028358089bc8066b8f80",
      },
    ],
  },
} satisfies QueryExample;
