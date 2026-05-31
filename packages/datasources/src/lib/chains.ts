import { anvil, type Chain } from "viem/chains";

/**
 * NOTE: devnet uses anvil's default chain id of 31337, but we over-specify it here for documentation
 * @see https://github.com/ensdomains/contracts-v2/blob/580c60a20e80decce21cf15aafd762f96a96d544/contracts/script/setup.ts#L55
 */
export const ensTestEnvChain = {
  ...anvil,
  id: 31337,
  name: "ens-test-env",
} as const satisfies Chain;
