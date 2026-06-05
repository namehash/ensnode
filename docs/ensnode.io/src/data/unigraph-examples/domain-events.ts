import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("V2 Sepolia");

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
WHERE d.canonical_name = 'wrapnation.eth'
AND d.canonical = true
ORDER BY e.block_number DESC, e.log_index DESC
LIMIT 5;
`,
    result: [
      {
        chain_id: "11155111",
        block_number: "10918673",
        transaction_hash: "0xca5e111932f0b26e1d458c690c5dfe8b2b8165ee2a937c04e4021e93a71954e4",
        log_index: 42,
        contract_address: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        sender: "0x801d2e48d378f161dba7ad7ad002ad557714c191",
        domain_id:
          "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-68387108911874305622019956908914347119991166106996198835225265868637904830464",
      },
      {
        chain_id: "11155111",
        block_number: "10918673",
        transaction_hash: "0xca5e111932f0b26e1d458c690c5dfe8b2b8165ee2a937c04e4021e93a71954e4",
        log_index: 38,
        contract_address: "0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1",
        sender: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        domain_id:
          "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-68387108911874305622019956908914347119991166106996198835225265868637904830464",
      },
      {
        chain_id: "11155111",
        block_number: "10918673",
        transaction_hash: "0xca5e111932f0b26e1d458c690c5dfe8b2b8165ee2a937c04e4021e93a71954e4",
        log_index: 37,
        contract_address: "0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1",
        sender: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        domain_id:
          "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-68387108911874305622019956908914347119991166106996198835225265868637904830464",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, desc, eq } from "drizzle-orm";

const name = "wrapnation.eth";
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
        blockNumber: "10918673",
        transactionHash: "0xca5e111932f0b26e1d458c690c5dfe8b2b8165ee2a937c04e4021e93a71954e4",
        logIndex: 42,
        contractAddress: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        sender: "0x801d2e48d378f161dba7ad7ad002ad557714c191",
        domainId:
          "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-68387108911874305622019956908914347119991166106996198835225265868637904830464",
      },
      {
        chainId: 11155111,
        blockNumber: "10918673",
        transactionHash: "0xca5e111932f0b26e1d458c690c5dfe8b2b8165ee2a937c04e4021e93a71954e4",
        logIndex: 38,
        contractAddress: "0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1",
        sender: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        domainId:
          "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-68387108911874305622019956908914347119991166106996198835225265868637904830464",
      },
      {
        chainId: 11155111,
        blockNumber: "10918673",
        transactionHash: "0xca5e111932f0b26e1d458c690c5dfe8b2b8165ee2a937c04e4021e93a71954e4",
        logIndex: 37,
        contractAddress: "0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1",
        sender: "0xb68e594a47fe057bd31e7a8229ffcfd85b2e28af",
        domainId:
          "11155111-0x64c81210d0e580cfc7746f3fb910bf0e8f6378e1-68387108911874305622019956908914347119991166106996198835225265868637904830464",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
