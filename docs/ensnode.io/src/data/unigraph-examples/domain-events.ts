import type { QueryExample } from "./types";

/**
 * Example query for fetching recent events for a Domain by its canonical name.
 */
export const exampleDomainEvents = {
  sql: {
    codeSnippet: `SELECT
  e.chain_id,
  e.block_number,
  e.transaction_hash,
  e.log_index,
  e.address as contract_address,
  e.sender,
  d.id as domain_id
FROM "ensindexer_0".events e
JOIN "ensindexer_0".domain_events de ON e.id = de.event_id
JOIN "ensindexer_0".domains d ON de.domain_id = d.id
WHERE d.canonical_name = 'vitalik.eth'
AND d.canonical = true
ORDER BY e.block_number DESC, e.log_index DESC
LIMIT 5;
`,
    result: [
      {
        chain_id: "11155111",
        block_number: "6023942",
        transaction_hash: "0x6206e95dc5ba5fc8d0804283498f17bac18081437b4198c824b62ee851622ba5",
        log_index: 194,
        contract_address: "0xfed6a969aaa60e4961fcd3ebf1a2e8913ac65b72",
        sender: "0x225f137127d9067788314bc7fcc1f36746a3c3b5",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "11155111",
        block_number: "6023942",
        transaction_hash: "0x6206e95dc5ba5fc8d0804283498f17bac18081437b4198c824b62ee851622ba5",
        log_index: 193,
        contract_address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        sender: "0x225f137127d9067788314bc7fcc1f36746a3c3b5",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "11155111",
        block_number: "4107392",
        transaction_hash: "0xf143118eb4100361f040b1ae5627562125f0cf1717073a8204befe5e512c80d4",
        log_index: 22,
        contract_address: "0x0635513f179d50a207757e05759cbd106d7dfce8",
        sender: "0x179a862703a4adfb29896552df9e307980d19285",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "11155111",
        block_number: "4107386",
        transaction_hash: "0x6410de03e9a2f12543e491d1048209e5638d702948cf23d48a63d96a50efd20d",
        log_index: 19,
        contract_address: "0xfed6a969aaa60e4961fcd3ebf1a2e8913ac65b72",
        sender: "0x179a862703a4adfb29896552df9e307980d19285",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "11155111",
        block_number: "4107386",
        transaction_hash: "0x6410de03e9a2f12543e491d1048209e5638d702948cf23d48a63d96a50efd20d",
        log_index: 16,
        contract_address: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        sender: "0x179a862703a4adfb29896552df9e307980d19285",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
    ],
  },
  sdk: {
    codeSnippet: `import { and, desc, eq } from "drizzle-orm";

const name = "vitalik.eth";
const limit = 5;

const domainEvents = await ensDb
  .select({
    chainId: ensIndexerSchema.event.chainId,
    blockNumber: ensIndexerSchema.event.blockNumber,
    transactionHash: ensIndexerSchema.event.transactionHash,
    logIndex: ensIndexerSchema.event.logIndex,
    contractAddress: ensIndexerSchema.event.address,
    sender: ensIndexerSchema.event.sender,
    domainId: ensIndexerSchema.domain.id,
  })
  .from(ensIndexerSchema.event)
  .innerJoin(
    ensIndexerSchema.domainEvent,
    eq(ensIndexerSchema.event.id, ensIndexerSchema.domainEvent.eventId),
  )
  .innerJoin(
    ensIndexerSchema.domain,
    eq(ensIndexerSchema.domainEvent.domainId, ensIndexerSchema.domain.id),
  )
  .where(
    and(
      eq(ensIndexerSchema.domain.canonicalName, name),
      eq(ensIndexerSchema.domain.canonical, true),
    ),
  )
  .orderBy(
    desc(ensIndexerSchema.event.blockNumber),
    desc(ensIndexerSchema.event.logIndex),
  )
  .limit(limit);

console.log(domainEvents);`,
    result: [
      {
        chainId: 11155111,
        blockNumber: "6023942",
        transactionHash: "0x6206e95dc5ba5fc8d0804283498f17bac18081437b4198c824b62ee851622ba5",
        logIndex: 194,
        contractAddress: "0xfed6a969aaa60e4961fcd3ebf1a2e8913ac65b72",
        sender: "0x225f137127d9067788314bc7fcc1f36746a3c3b5",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 11155111,
        blockNumber: "6023942",
        transactionHash: "0x6206e95dc5ba5fc8d0804283498f17bac18081437b4198c824b62ee851622ba5",
        logIndex: 193,
        contractAddress: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        sender: "0x225f137127d9067788314bc7fcc1f36746a3c3b5",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 11155111,
        blockNumber: "4107392",
        transactionHash: "0xf143118eb4100361f040b1ae5627562125f0cf1717073a8204befe5e512c80d4",
        logIndex: 22,
        contractAddress: "0x0635513f179d50a207757e05759cbd106d7dfce8",
        sender: "0x179a862703a4adfb29896552df9e307980d19285",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 11155111,
        blockNumber: "4107386",
        transactionHash: "0x6410de03e9a2f12543e491d1048209e5638d702948cf23d48a63d96a50efd20d",
        logIndex: 19,
        contractAddress: "0xfed6a969aaa60e4961fcd3ebf1a2e8913ac65b72",
        sender: "0x179a862703a4adfb29896552df9e307980d19285",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 11155111,
        blockNumber: "4107386",
        transactionHash: "0x6410de03e9a2f12543e491d1048209e5638d702948cf23d48a63d96a50efd20d",
        logIndex: 16,
        contractAddress: "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e",
        sender: "0x179a862703a4adfb29896552df9e307980d19285",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
    ],
  },
} satisfies QueryExample;
