import { ponder } from "ponder:registry";
import config from "@/config";
import { getENSRootChainId } from "@ensnode/datasources";
import { DEFAULT_EVM_COIN_TYPE, evmChainIdToCoinType } from "@ensnode/ensnode-sdk";
import { toHex } from "viem";

/**
 * Handler functions for ENSIP-19 StandaloneReverseRegistrar contracts. These contracts manage
 * `name` records for an address, per-coinType (derived from context.chain.id).
 */
export default function () {
  ponder.on("StandaloneReverseRegistrar:NameForAddrChanged", async ({ context, event }) => {
    const { addr: address, name } = event.args;

    // The DefaultReverseRegistrar on the ENS Root chain manages 'default' names under the default coinType.
    // On any other chain, the L2ReverseRegistrar manages names for that chain's coinType.
    const coinType =
      context.chain.id === getENSRootChainId(config.namespace)
        ? DEFAULT_EVM_COIN_TYPE
        : evmChainIdToCoinType(context.chain.id);

    const isDeletion = !!name;

    console.log({
      on: "StandaloneReverseRegistrar:NameForAddrChanged",
      chainId: context.chain.id,
      coinType: toHex(coinType),
      address,
      name,
      standaloneReverseRegistrarAddress: event.log.address,
    });

    // TODO: upsert entity representing (address, coinType) -> Name
    // TODO: treat empty string name as deletion
  });
}
