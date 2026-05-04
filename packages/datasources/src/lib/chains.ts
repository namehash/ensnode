import { anvil, type Chain, sepolia } from "viem/chains";

export const ensTestEnvChain = {
  ...anvil,
  // NOTE: devnet uses anvil's default chain id of 31337, but we over-specify it here for documentation
  // https://github.com/ensdomains/contracts-v2/blob/580c60a20e80decce21cf15aafd762f96a96d544/contracts/script/setup.ts#L55
  id: 31337,
  name: "ens-test-env",
} as const satisfies Chain;

/**
 * NOTE: sepoliaV2Chain requires access to the Tenderly Virtual RPC Endpoint configured as
 * RPC_URL_99911155111.
 */
export const sepoliaV2Chain = {
  ...sepolia,
  id: 99911155111,
  name: "Sepolia V2 (Virtual)",
} as const satisfies Chain;
