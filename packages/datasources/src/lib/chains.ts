import { type Chain, localhost } from "viem/chains";

/**
 * The ens-test-env chain id is 1:
 * @see https://github.com/ensdomains/contracts-v2/blob/762de44d60b2588b2e92a6d29df941c4de821ae6/contracts/script/setup.ts#L40
 */

export const ensTestEnvChain = {
  ...localhost,
  id: 1,
  name: "ens-test-env",
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
} as const satisfies Chain;
