import config from "@/config";

import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { getENSRootChainId } from "@ensnode/datasources";
import { DEFAULT_EVM_COIN_TYPE, PluginName, evmChainIdToCoinType } from "@ensnode/ensnode-sdk";

import { interpretNameRecordValue } from "@/lib/interpret-record-values";
import { namespaceContract } from "@/lib/plugin-helpers";

/**
 * Handler functions for ENSIP-19 StandaloneReverseRegistrar contracts in the Protocol Acceleration
 * plugin.
 * - indexes ENSIP-19 Reverse Name Records for an address, per-coinType (derived from context.chain.id)
 */
export default function () {
  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "StandaloneReverseRegistrar:NameForAddrChanged",
    ),
    async ({ context, event }) => {
      const { addr: address, name } = event.args;

      // The DefaultReverseRegistrar on the ENS Root chain manages 'default' names under the default coinType.
      // On any other chain, the L2ReverseRegistrar manages names for that chain's coinType.
      const coinType =
        context.chain.id === getENSRootChainId(config.namespace)
          ? DEFAULT_EVM_COIN_TYPE
          : evmChainIdToCoinType(context.chain.id);

      // construct the ReverseNameRecord entity's Composite Primary Key
      const id = { address, coinType: BigInt(coinType) };

      // interpret the emitted name record value (see `interpretNameRecordValue` for guarantees)
      const interpretedValue = interpretNameRecordValue(name);

      // if the interpreted value is null, consider it a deletion
      const isDeletion = interpretedValue === null;
      if (isDeletion) {
        // delete
        await context.db.delete(schema.reverseNameRecord, id);
      } else {
        // upsert
        await context.db
          .insert(schema.reverseNameRecord)
          .values({ ...id, value: interpretedValue })
          .onConflictDoUpdate({ value: interpretedValue });
      }
    },
  );
}
