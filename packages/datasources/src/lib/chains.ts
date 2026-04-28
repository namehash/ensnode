import { type Chain, localhost } from "viem/chains";

/**
 * After devnet commit 5750aae86, the default devnet ChainId was updated to 1. Within the context of
 * Ponder, this collision with mainnet.id ambiguates the mainnet and devnet ponder_sync cache. The
 * collision also affects all chain.id branches in the ENSNode project, as well as potentially any
 * other EVM tooling. To avoid this collision, we use a custom ChainId for the devnet, reverting it
 * to the Anvil default. This disambiguates mainnet and the devnet, avoiding any possible issues.
 *
 * It remains a possibility that this fracturing of the expected devnet chain id will lead to
 * downstream incompatibilites or errors.
 */
const DEVNET_CHAIN_ID = 31337;

export const ensTestEnvChain = {
  ...localhost,
  id: DEVNET_CHAIN_ID,
  name: "ens-test-env",
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
} as const satisfies Chain;
