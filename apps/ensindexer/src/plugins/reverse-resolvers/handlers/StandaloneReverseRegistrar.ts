import { ponder } from "ponder:registry";
import { evmChainIdToCoinType } from "@ensnode/ensnode-sdk";

/**
 * Handler functions for ENSIP-19 StandaloneReverseRegistrar contracts. These contracts manage
 * `name` records for an address, per-coinType (via chainId).
 */
export default function () {
  ponder.on("StandaloneReverseRegistrar:NameForAddrChanged", async ({ context, event }) => {
    const { addr: address, name } = event.args;
    const coinType = evmChainIdToCoinType(context.chain.id);

    console.log({
      on: "StandaloneReverseRegistrar:NameForAddrChanged",
      chainId: context.chain.id,
      coinType,
      address,
      name,
      standaloneReverseRegistrarAddress: event.log.address,
    });

    // TODO: upsert entity representing (address, coinType) -> Name
    // TODO: treat empty string name as deletion
  });
}
