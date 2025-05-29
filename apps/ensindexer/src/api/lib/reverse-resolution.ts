import { resolveForward } from "@/api/lib/forward-resolution";
import { evmCoinTypeForChainId, reverseName } from "@ensnode/ensnode-sdk";
import { Address, Chain } from "viem";

export async function resolveReverse(address: Address, chainId: Chain["id"] = 1) {
  const coinType = BigInt(evmCoinTypeForChainId(chainId));
  return resolveForward(reverseName(address, coinType), { name: true, texts: ["avatar"] });
}
