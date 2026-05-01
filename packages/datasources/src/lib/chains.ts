import { type Chain, localhost, sepolia } from "viem/chains";

/**
 * The devnet's default chain id.
 *
 * @see https://github.com/ensdomains/contracts-v2/blob/580c60a20e80decce21cf15aafd762f96a96d544/contracts/script/setup.ts#L55
 */
const DEVNET_CHAIN_ID = 31337;

export const ensTestEnvChain = {
  ...localhost,
  id: DEVNET_CHAIN_ID,
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
