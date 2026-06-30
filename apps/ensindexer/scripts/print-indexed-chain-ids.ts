// Build the ENSIndexerConfig from the ambient environment and print the indexed chain IDs, one per
// line in ascending order. Used by the remote-checkpoint pipeline's end-block mode to derive which
// chains to resolve per-chain end blocks for — instead of hardcoding/passing a CHAIN_IDS list. Run
// with the same identity env (NAMESPACE/PLUGINS/...) the indexer uses:
//   pnpm -F ensindexer exec tsx scripts/print-indexed-chain-ids.ts
import { buildConfigFromEnvironment } from "../src/config/config.schema";

const config = buildConfigFromEnvironment(process.env);
for (const chainId of [...config.indexedChainIds].sort((a, b) => Number(a) - Number(b))) {
  console.log(chainId);
}
