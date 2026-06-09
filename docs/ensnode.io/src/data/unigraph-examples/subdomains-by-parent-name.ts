import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha");

/**
 * Example query for fetching subdomains by their canonical name of the parent domain.
 */
export const exampleSubdomainsByParentName = {
  sql: {
    codeSnippet: `WITH parent AS (
  SELECT subregistry_id
  FROM "ensindexer_0".domains
  WHERE canonical_name = 'ens.eth'
  AND canonical = true
)
SELECT
  d.type,
  d.canonical_name,
  d.canonical_node,
  d.owner_id,
  d.id as domain_id
FROM "ensindexer_0".domains d
JOIN parent p ON d.registry_id = p.subregistry_id
WHERE d.canonical = true
ORDER BY d.__canonical_name_prefix ASC
LIMIT 10;
`,
    result: [
      {
        type: "ENSv1Domain",
        canonical_name: "app.ens.eth",
        canonical_node: "0x50a74dcf107973068dfc00db69ecf98b49d52f5361cb4db5feb740fc9f4f74d1",
        owner_id: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x50a74dcf107973068dfc00db69ecf98b49d52f5361cb4db5feb740fc9f4f74d1",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "attestations.ens.eth",
        canonical_node: "0x9e5c7a2f2ab8b565c6d2c4851a73decb53d1f6a23c97a2b5b66f21d8ace1bbd5",
        owner_id: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x9e5c7a2f2ab8b565c6d2c4851a73decb53d1f6a23c97a2b5b66f21d8ace1bbd5",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "coldwallet.ens.eth",
        canonical_node: "0xc867d2bd24b8a88c7d5d416dfab28fec6858b5a86f3a1c94faeab450c34023f6",
        owner_id: "0x690f0581ececcf8389c223170778cd9d029606f2",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xc867d2bd24b8a88c7d5d416dfab28fec6858b5a86f3a1c94faeab450c34023f6",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "controller.ens.eth",
        canonical_node: "0xceecb75ad42a60ea38b777bf842c14af3303219e2722a192ddeac19faa7fbb1c",
        owner_id: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xceecb75ad42a60ea38b777bf842c14af3303219e2722a192ddeac19faa7fbb1c",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "design.ens.eth",
        canonical_node: "0xe55e79685b24c7b16542f3c613a8899986ace5e2e08b3c9444ce70d81d49bcd2",
        owner_id: "0x690f0581ececcf8389c223170778cd9d029606f2",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xe55e79685b24c7b16542f3c613a8899986ace5e2e08b3c9444ce70d81d49bcd2",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "dnsname.ens.eth",
        canonical_node: "0x250712f87e86832e8bed775a563920aed01b926d9d21950e363a042af40ad2b5",
        owner_id: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x250712f87e86832e8bed775a563920aed01b926d9d21950e363a042af40ad2b5",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "dnsregistrar.ens.eth",
        canonical_node: "0x3124e45545d17d9fda8e24a7a09f111a0802ea26ce6b1f14c75c832442deb65d",
        owner_id: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x3124e45545d17d9fda8e24a7a09f111a0802ea26ce6b1f14c75c832442deb65d",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "dnssec.ens.eth",
        canonical_node: "0x287e74fe5b4463a7e8b8d4c4cccae51a8ab397df053bc829c6a4e26963c7ce2b",
        owner_id: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x287e74fe5b4463a7e8b8d4c4cccae51a8ab397df053bc829c6a4e26963c7ce2b",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "docs.ens.eth",
        canonical_node: "0x08625bbdd59ae52e6a0e3f8f2bd6213e60ad35276510c83d117c7a2a68bc65c0",
        owner_id: "0xee9eeaab0bb7d9b969d701f6f8212609edea252e",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x08625bbdd59ae52e6a0e3f8f2bd6213e60ad35276510c83d117c7a2a68bc65c0",
      },
      {
        type: "ENSv1Domain",
        canonical_name: "ecosystem.ens.eth",
        canonical_node: "0x44ea949951a1e21fe141e9979ef9af0cef3df0ac50004c19309df97fef6c9023",
        owner_id: "0x690f0581ececcf8389c223170778cd9d029606f2",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x44ea949951a1e21fe141e9979ef9af0cef3df0ac50004c19309df97fef6c9023",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, eq, inArray, asc } from "drizzle-orm";

const name = "ens.eth";
const limit = 10;

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
      ownerId: ensIndexerSchema.domain.ownerId,
      domainId: ensIndexerSchema.domain.id,
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
        canonicalName: "app.ens.eth",
        canonicalNode: "0x50a74dcf107973068dfc00db69ecf98b49d52f5361cb4db5feb740fc9f4f74d1",
        ownerId: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x50a74dcf107973068dfc00db69ecf98b49d52f5361cb4db5feb740fc9f4f74d1",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "attestations.ens.eth",
        canonicalNode: "0x9e5c7a2f2ab8b565c6d2c4851a73decb53d1f6a23c97a2b5b66f21d8ace1bbd5",
        ownerId: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x9e5c7a2f2ab8b565c6d2c4851a73decb53d1f6a23c97a2b5b66f21d8ace1bbd5",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "coldwallet.ens.eth",
        canonicalNode: "0xc867d2bd24b8a88c7d5d416dfab28fec6858b5a86f3a1c94faeab450c34023f6",
        ownerId: "0x690f0581ececcf8389c223170778cd9d029606f2",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xc867d2bd24b8a88c7d5d416dfab28fec6858b5a86f3a1c94faeab450c34023f6",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "controller.ens.eth",
        canonicalNode: "0xceecb75ad42a60ea38b777bf842c14af3303219e2722a192ddeac19faa7fbb1c",
        ownerId: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xceecb75ad42a60ea38b777bf842c14af3303219e2722a192ddeac19faa7fbb1c",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "design.ens.eth",
        canonicalNode: "0xe55e79685b24c7b16542f3c613a8899986ace5e2e08b3c9444ce70d81d49bcd2",
        ownerId: "0x690f0581ececcf8389c223170778cd9d029606f2",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xe55e79685b24c7b16542f3c613a8899986ace5e2e08b3c9444ce70d81d49bcd2",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "dnsname.ens.eth",
        canonicalNode: "0x250712f87e86832e8bed775a563920aed01b926d9d21950e363a042af40ad2b5",
        ownerId: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x250712f87e86832e8bed775a563920aed01b926d9d21950e363a042af40ad2b5",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "dnsregistrar.ens.eth",
        canonicalNode: "0x3124e45545d17d9fda8e24a7a09f111a0802ea26ce6b1f14c75c832442deb65d",
        ownerId: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x3124e45545d17d9fda8e24a7a09f111a0802ea26ce6b1f14c75c832442deb65d",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "dnssec.ens.eth",
        canonicalNode: "0x287e74fe5b4463a7e8b8d4c4cccae51a8ab397df053bc829c6a4e26963c7ce2b",
        ownerId: "0xb6e040c9ecaae172a89bd561c5f73e1c48d28cd9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x287e74fe5b4463a7e8b8d4c4cccae51a8ab397df053bc829c6a4e26963c7ce2b",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "docs.ens.eth",
        canonicalNode: "0x08625bbdd59ae52e6a0e3f8f2bd6213e60ad35276510c83d117c7a2a68bc65c0",
        ownerId: "0xee9eeaab0bb7d9b969d701f6f8212609edea252e",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x08625bbdd59ae52e6a0e3f8f2bd6213e60ad35276510c83d117c7a2a68bc65c0",
      },
      {
        type: "ENSv1Domain",
        canonicalName: "ecosystem.ens.eth",
        canonicalNode: "0x44ea949951a1e21fe141e9979ef9af0cef3df0ac50004c19309df97fef6c9023",
        ownerId: "0x690f0581ececcf8389c223170778cd9d029606f2",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x44ea949951a1e21fe141e9979ef9af0cef3df0ac50004c19309df97fef6c9023",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
