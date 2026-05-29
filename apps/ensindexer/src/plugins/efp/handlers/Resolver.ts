import type { Hex } from "viem";

import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";

import { DEFAULT_EFP_LIST_TEXT_RECORD_KEY } from "../constants";
import { ensListPointerId } from "../lib/ids";
import { parseEfpListTextRecord } from "../lib/parse-efp-list-text-record";

const pluginName = PluginName.EFP;

/**
 * Registers the EFP `Resolver` event handler for the `eth.efp.list` text record (TextChanged).
 */
export default function () {
  // TextChanged — index the `eth.efp.list` text record into efp_ens_list_pointers.
  //
  // We subscribe to the modern (with-value) TextChanged overload across every mainnet Resolver
  // (the contract is address-less), mirroring how Protocol Acceleration indexes Resolvers, and
  // filter to the well-known key here. The merged Resolver ABI's overloaded TextChanged precludes
  // a contract-level `indexedKey` topic filter, so the key check is the filter.
  addOnchainEventListener(
    namespaceContract(
      pluginName,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    async ({ context, event }) => {
      if (event.args.key !== DEFAULT_EFP_LIST_TEXT_RECORD_KEY) return;

      const ts = event.block.timestamp;
      const chainId = context.chain.id;
      const resolver = event.log.address.toLowerCase() as Hex;
      const node = event.args.node.toLowerCase() as Hex;
      const id = ensListPointerId(chainId, resolver, node, DEFAULT_EFP_LIST_TEXT_RECORD_KEY);

      // An empty or unparseable value clears the pointer (ENS convention: empty == unset).
      if (!event.args.value) {
        await context.ensDb.delete(ensIndexerSchema.efpEnsListPointers, { id });
        return;
      }
      const parsed = parseEfpListTextRecord(event.args.value);
      if (!parsed) {
        await context.ensDb.delete(ensIndexerSchema.efpEnsListPointers, { id });
        return;
      }

      await context.ensDb
        .insert(ensIndexerSchema.efpEnsListPointers)
        .values({
          id,
          chainId,
          resolver,
          node,
          ensKey: DEFAULT_EFP_LIST_TEXT_RECORD_KEY,
          rawValue: event.args.value,
          listTokenId: parsed.listTokenId,
          listContract: parsed.listContract,
          listChainId: parsed.listChainId,
          createdAt: ts,
          updatedAt: ts,
        })
        .onConflictDoUpdate({
          rawValue: event.args.value,
          listTokenId: parsed.listTokenId,
          listContract: parsed.listContract,
          listChainId: parsed.listChainId,
          updatedAt: ts,
        });
    },
  );
}
