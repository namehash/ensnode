import { type Chain, localhost } from "viem/chains";

/**
 * The ens-test-env chain id is 1:
 * @see https://github.com/ensdomains/contracts-v2/blob/9f26a8f01f1f87db1c5d57b9faa8e76f0c5043ef/contracts/script/setup.ts#L91
 */

export const ensTestEnvChain = {
  ...localhost,
  id: 1,
  name: "ens-test-env",
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
} as const satisfies Chain;
