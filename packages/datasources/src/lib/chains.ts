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
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
} as const satisfies Chain;

export const sepoliaV2Chain = {
  ...sepolia,
  id: 99911155111,
  name: "Sepolia V2 (Virtual)",
  rpcUrls: {
    default: {
      http: [
        "https://virtual.sepolia.us-east.rpc.tenderly.co/881ddb0f-475d-45ac-b93d-e1aca2841811",
      ],
    },
  },
} as const satisfies Chain;
