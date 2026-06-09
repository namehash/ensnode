import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha");

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
  e.from,
  e.to,
  e.selector
  e.topics,
  e.data,
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
        chain_id: "1",
        block_number: "24001264",
        transaction_hash: "0x4d584f398c80ca58761fb3777aaa13f92966e92de157c6eea6bf334108175c74",
        log_index: 672,
        contract_address: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        sender: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        from: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        to: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        selector: "0xfa956c3bce4cb4b01166868ecaf0620566bc7e33fc70b0b9c6aef61e37e50b94",
        topics: [
          "0xfa956c3bce4cb4b01166868ecaf0620566bc7e33fc70b0b9c6aef61e37e50b94",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000005bfd03e6f073f0000000000000000000000000000000000000000000000000000000092b2344a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007766974616c696b00000000000000000000000000000000000000000000000000",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "1",
        block_number: "24001264",
        transaction_hash: "0x4d584f398c80ca58761fb3777aaa13f92966e92de157c6eea6bf334108175c74",
        log_index: 671,
        contract_address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        sender: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        from: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        to: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        selector: "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
        topics: [
          "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000092b2344a",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "1",
        block_number: "23041336",
        transaction_hash: "0x97f2a1c01c3c252415a6b41f31d24fa69aa2d1c23bddbacaacd297f4b88467b5",
        log_index: 888,
        contract_address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        sender: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        from: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        to: "0x253553366da8546fc250f225fe3d25d0c782303b",
        selector: "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
        topics: [
          "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000004d95695bef9eb0000000000000000000000000000000000000000000000000000000090d100ca0000000000000000000000000000000000000000000000000000000000000007766974616c696b00000000000000000000000000000000000000000000000000",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "1",
        block_number: "23041336",
        transaction_hash: "0x97f2a1c01c3c252415a6b41f31d24fa69aa2d1c23bddbacaacd297f4b88467b5",
        log_index: 887,
        contract_address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        sender: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        from: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        to: "0x253553366da8546fc250f225fe3d25d0c782303b",
        selector: "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
        topics: [
          "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000090d100ca",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chain_id: "1",
        block_number: "21883127",
        transaction_hash: "0x8a105e50b30df4a93b038093cf4fdf87af1710703bf4bf6323651391fff23a27",
        log_index: 208,
        contract_address: "0x253553366da8546fc250f225fe3d25d0c782303b",
        sender: "0x91c8d85c0093cd2a985234916799a3eca1062912",
        from: "0x91c8d85c0093cd2a985234916799a3eca1062912",
        to: "0x253553366da8546fc250f225fe3d25d0c782303b",
        selector: "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
        topics: [
          "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000e5b190b5e9bcd000000000000000000000000000000000000000000000000000000008eefcd4a0000000000000000000000000000000000000000000000000000000000000007766974616c696b00000000000000000000000000000000000000000000000000",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
    ],
    resultNote,
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
    from: ensIndexerSchema.event.from,
    to: ensIndexerSchema.event.to,
    selector: ensIndexerSchema.event.selector,
    topics: ensIndexerSchema.event.topics,
    data: ensIndexerSchema.event.data,
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
        chainId: 1,
        blockNumber: "24001264",
        transactionHash: "0x4d584f398c80ca58761fb3777aaa13f92966e92de157c6eea6bf334108175c74",
        logIndex: 672,
        contractAddress: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        sender: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        from: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        to: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        selector: "0xfa956c3bce4cb4b01166868ecaf0620566bc7e33fc70b0b9c6aef61e37e50b94",
        topics: [
          "0xfa956c3bce4cb4b01166868ecaf0620566bc7e33fc70b0b9c6aef61e37e50b94",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000005bfd03e6f073f0000000000000000000000000000000000000000000000000000000092b2344a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007766974616c696b00000000000000000000000000000000000000000000000000",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 1,
        blockNumber: "24001264",
        transactionHash: "0x4d584f398c80ca58761fb3777aaa13f92966e92de157c6eea6bf334108175c74",
        logIndex: 671,
        contractAddress: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        sender: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        from: "0x24e70b286513300a8a89a6d6433cee18412b6ace",
        to: "0x59e16fccd424cc24e280be16e11bcd56fb0ce547",
        selector: "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
        topics: [
          "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000092b2344a",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 1,
        blockNumber: "23041336",
        transactionHash: "0x97f2a1c01c3c252415a6b41f31d24fa69aa2d1c23bddbacaacd297f4b88467b5",
        logIndex: 888,
        contractAddress: "0x253553366da8546fc250f225fe3d25d0c782303b",
        sender: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        from: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        to: "0x253553366da8546fc250f225fe3d25d0c782303b",
        selector: "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
        topics: [
          "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000004d95695bef9eb0000000000000000000000000000000000000000000000000000000090d100ca0000000000000000000000000000000000000000000000000000000000000007766974616c696b00000000000000000000000000000000000000000000000000",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 1,
        blockNumber: "23041336",
        transactionHash: "0x97f2a1c01c3c252415a6b41f31d24fa69aa2d1c23bddbacaacd297f4b88467b5",
        logIndex: 887,
        contractAddress: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        sender: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        from: "0x6447b1874b56a223eea2e6fafa2d1442075fbec7",
        to: "0x253553366da8546fc250f225fe3d25d0c782303b",
        selector: "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
        topics: [
          "0x9b87a00e30f1ac65d898f070f8a3488fe60517182d0a2098e1b4b93a54aa9bd6",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000090d100ca",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
      {
        chainId: 1,
        blockNumber: "21883127",
        transactionHash: "0x8a105e50b30df4a93b038093cf4fdf87af1710703bf4bf6323651391fff23a27",
        logIndex: 208,
        contractAddress: "0x253553366da8546fc250f225fe3d25d0c782303b",
        sender: "0x91c8d85c0093cd2a985234916799a3eca1062912",
        from: "0x91c8d85c0093cd2a985234916799a3eca1062912",
        to: "0x253553366da8546fc250f225fe3d25d0c782303b",
        selector: "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
        topics: [
          "0x3da24c024582931cfaf8267d8ed24d13a82a8068d5bd337d30ec45cea4e506ae",
          "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000e5b190b5e9bcd000000000000000000000000000000000000000000000000000000008eefcd4a0000000000000000000000000000000000000000000000000000000000000007766974616c696b00000000000000000000000000000000000000000000000000",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
