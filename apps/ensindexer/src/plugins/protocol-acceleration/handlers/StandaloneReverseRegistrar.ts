import config from "@/config";

import { asLiteralName, DEFAULT_EVM_COIN_TYPE, evmChainIdToCoinType } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { interpretNameRecordValue } from "@ensnode/ensnode-sdk/internal";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

/**
 * Handler functions for ENSIP-19 StandaloneReverseRegistrar contracts in the Protocol Acceleration
 * plugin.
 * - indexes ENSIP-19 Reverse Name Records for an address, per-coinType (derived from context.chain.id)
 */
export default function () {
  addOnchainEventListener(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "StandaloneReverseRegistrar:NameForAddrChanged",
    ),
    async ({ context, event }) => {
      const { addr: address } = event.args;
      const name = asLiteralName(event.args.name);

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
        await context.ensDb.delete(ensIndexerSchema.reverseNameRecord, id);
      } else {
        // upsert
        await context.ensDb
          .insert(ensIndexerSchema.reverseNameRecord)
          .values({ ...id, value: interpretedValue })
          .onConflictDoUpdate({ value: interpretedValue });
      }
    },
  );
}
