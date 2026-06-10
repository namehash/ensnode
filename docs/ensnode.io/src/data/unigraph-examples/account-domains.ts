import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha");

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
AND d.owner_id = '0x179a862703a4adfb29896552df9e307980d19285'
ORDER BY d.__canonical_name_prefix ASC
LIMIT 10;`,
    result: [
      {
        type: "ENSv1Domain",
        canonical_name: "179a862703a4adfb29896552df9e307980d19285.addr.reverse",
        canonical_node: "0xf7bb5852f23c4f92e78491e28d1e5897718c1eefb6c6fdd2224fddcdd09214de",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xf7bb5852f23c4f92e78491e28d1e5897718c1eefb6c6fdd2224fddcdd09214de",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name:
          "[57af2a1afc4eeb2d190972d23b65ffbd77a900d7b5ba894214aec651eb8cdb99].mrgreg.eth",
        canonical_node: "0x2c4c3a3e03f46fd80907cc2a9e7da72e7fbd098f85c59321a7fb7174a289bb85",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x2c4c3a3e03f46fd80907cc2a9e7da72e7fbd098f85c59321a7fb7174a289bb85",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "89bd55f729c552da9e88102f5044bb0a770fe512.addr.reverse",
        canonical_node: "0xdf1447a9b5d1728977edc04658a38c770097a3b66291d9b5cf913f0892aecf0c",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xdf1447a9b5d1728977edc04658a38c770097a3b66291d9b5cf913f0892aecf0c",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "breadbygreg.eth",
        canonical_node: "0x0e09603eaf9854179bf6b83db80dc5f9bab46c629ea87e4dcabf9a43eab0cf97",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x0e09603eaf9854179bf6b83db80dc5f9bab46c629ea87e4dcabf9a43eab0cf97",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "cae0d70e3601d45ca70c20d26f8b440b27d89a1d.addr.reverse",
        canonical_node: "0x412ccdc26a20bfe0e97f37026a2bfdd9e92dc470bde4cf810ffd77a4069a2bed",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x412ccdc26a20bfe0e97f37026a2bfdd9e92dc470bde4cf810ffd77a4069a2bed",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "contract.gtest.eth",
        canonical_node: "0x3d831d932784bc862d38e8e8872f06209e41030680f8fcf7c97be30494346654",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x3d831d932784bc862d38e8e8872f06209e41030680f8fcf7c97be30494346654",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "devtools.eth",
        canonical_node: "0xfb17155dd713fe4143c2011b392167ea09f6958c5f1b14ffa7eacf1a21badfab",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xfb17155dd713fe4143c2011b392167ea09f6958c5f1b14ffa7eacf1a21badfab",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "ens.gregskril.eth",
        canonical_node: "0x4fedc4305d84a415763cffb1b55a88dcea3dfde44b8787a6bd98223aac01b58e",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x4fedc4305d84a415763cffb1b55a88dcea3dfde44b8787a6bd98223aac01b58e",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "enswidgets.eth",
        canonical_node: "0x2aff6e58dd1a29ed067afd547694b14b9389bda8285c0fc5f944c64b78ff7858",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x2aff6e58dd1a29ed067afd547694b14b9389bda8285c0fc5f944c64b78ff7858",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "ethtoolkit.eth",
        canonical_node: "0x3c78cc3bb454bb4cd8f6c3dc39a567d29c4b812207a3935bd1fddcc924f3fcd4",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x3c78cc3bb454bb4cd8f6c3dc39a567d29c4b812207a3935bd1fddcc924f3fcd4",
        owner_id: "0x179a862703a4adfb29896552df9e307980d19285",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq, asc } from "drizzle-orm";

const owner = "0x179a862703a4adfb29896552df9e307980d19285";
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
  .orderBy(asc(ensIndexerSchema.domain.__canonicalNamePrefix))
  .limit(limit);

console.log(accountDomains);`,
    result: [
      {
        type: "ENSv1Domain",
        canonicalName: "179a862703a4adfb29896552df9e307980d19285.addr.reverse",
        canonicalNode: "0xf7bb5852f23c4f92e78491e28d1e5897718c1eefb6c6fdd2224fddcdd09214de",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xf7bb5852f23c4f92e78491e28d1e5897718c1eefb6c6fdd2224fddcdd09214de",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName:
          "[57af2a1afc4eeb2d190972d23b65ffbd77a900d7b5ba894214aec651eb8cdb99].mrgreg.eth",
        canonicalNode: "0x2c4c3a3e03f46fd80907cc2a9e7da72e7fbd098f85c59321a7fb7174a289bb85",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x2c4c3a3e03f46fd80907cc2a9e7da72e7fbd098f85c59321a7fb7174a289bb85",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "89bd55f729c552da9e88102f5044bb0a770fe512.addr.reverse",
        canonicalNode: "0xdf1447a9b5d1728977edc04658a38c770097a3b66291d9b5cf913f0892aecf0c",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xdf1447a9b5d1728977edc04658a38c770097a3b66291d9b5cf913f0892aecf0c",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "breadbygreg.eth",
        canonicalNode: "0x0e09603eaf9854179bf6b83db80dc5f9bab46c629ea87e4dcabf9a43eab0cf97",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x0e09603eaf9854179bf6b83db80dc5f9bab46c629ea87e4dcabf9a43eab0cf97",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "cae0d70e3601d45ca70c20d26f8b440b27d89a1d.addr.reverse",
        canonicalNode: "0x412ccdc26a20bfe0e97f37026a2bfdd9e92dc470bde4cf810ffd77a4069a2bed",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x412ccdc26a20bfe0e97f37026a2bfdd9e92dc470bde4cf810ffd77a4069a2bed",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "contract.gtest.eth",
        canonicalNode: "0x3d831d932784bc862d38e8e8872f06209e41030680f8fcf7c97be30494346654",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x3d831d932784bc862d38e8e8872f06209e41030680f8fcf7c97be30494346654",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "devtools.eth",
        canonicalNode: "0xfb17155dd713fe4143c2011b392167ea09f6958c5f1b14ffa7eacf1a21badfab",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xfb17155dd713fe4143c2011b392167ea09f6958c5f1b14ffa7eacf1a21badfab",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "ens.gregskril.eth",
        canonicalNode: "0x4fedc4305d84a415763cffb1b55a88dcea3dfde44b8787a6bd98223aac01b58e",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x4fedc4305d84a415763cffb1b55a88dcea3dfde44b8787a6bd98223aac01b58e",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "enswidgets.eth",
        canonicalNode: "0x2aff6e58dd1a29ed067afd547694b14b9389bda8285c0fc5f944c64b78ff7858",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x2aff6e58dd1a29ed067afd547694b14b9389bda8285c0fc5f944c64b78ff7858",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "ethtoolkit.eth",
        canonicalNode: "0x3c78cc3bb454bb4cd8f6c3dc39a567d29c4b812207a3935bd1fddcc924f3fcd4",
        id: "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x3c78cc3bb454bb4cd8f6c3dc39a567d29c4b812207a3935bd1fddcc924f3fcd4",
        ownerId: "0x179a862703a4adfb29896552df9e307980d19285",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
