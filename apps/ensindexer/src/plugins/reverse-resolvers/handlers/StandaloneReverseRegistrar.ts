import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import config from "@/config";
import { makePrimaryNameId } from "@/lib/ids";
import { getENSRootChainId } from "@ensnode/datasources";
import {
  DEFAULT_EVM_COIN_TYPE,
  evmChainIdToCoinType,
  interpretNameRecordValue,
} from "@ensnode/ensnode-sdk";

/**
 * Handler functions for ENSIP-19 StandaloneReverseRegistrar contracts. These contracts manage
 * `name` records for an address, per-coinType (derived from context.chain.id).
 */
export default function () {
  ponder.on("StandaloneReverseRegistrar:NameForAddrChanged", async ({ context, event }) => {
    const { addr: address, name: _name } = event.args;

    // The DefaultReverseRegistrar on the ENS Root chain manages 'default' names under the default coinType.
    // On any other chain, the L2ReverseRegistrar manages names for that chain's coinType.
    const coinType =
      context.chain.id === getENSRootChainId(config.namespace)
        ? DEFAULT_EVM_COIN_TYPE
        : evmChainIdToCoinType(context.chain.id);

    const id = makePrimaryNameId(address, coinType);

    // interpret the emitted name record values (see `interpretNameRecordValue` for guarantees)
    const name = interpretNameRecordValue(_name);

    // if the coerced value is null, consider it a deletion
    const isDeletion = name === null;
    if (isDeletion) {
      // delete
      await context.db.delete(schema.ext_primaryName, { id });
    } else {
      // upsert
      await context.db
        .insert(schema.ext_primaryName)
        // create a new primary name entity
        .values({
          id,
          address,
          coinType: BigInt(coinType),
          name,
        })
        // or update the existing one
        .onConflictDoUpdate({ name });
    }
  });
}
