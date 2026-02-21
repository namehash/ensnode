import { type Chain, localhost } from "viem/chains";

/**
 * The Default Chain Id for Devnet
 * @see https://github.com/ensdomains/contracts-v2/blob/762de44d60b2588b2e92a6d29df941c4de821ae6/contracts/script/setup.ts#L40
 */
const DEVNET_DEFAULT_CHAIN_ID = 0xeeeeed;

export const ensTestEnvChain = {
  ...localhost,
  id: DEVNET_DEFAULT_CHAIN_ID,
  name: "ens-test-env",
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
} as const satisfies Chain;
