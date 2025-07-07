import { ponder } from "ponder:registry";
import { efp_listStorageLocation, efp_listToken } from "ponder:schema";

import config from "@/config";
import type { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";
import { zeroAddress } from "viem";
import {
  decodeListStorageLocationContract,
  isEncodedLslContract,
  parseEncodedLsl,
} from "../lib/lsl";
import { parseEvmAddress } from "../lib/utils";

export default function ({ pluginNamespace: ns }: ENSIndexerPluginHandlerArgs<PluginName.EFP>) {
  ///
  /// EFPListRegistry Handlers
  ///
  ponder.on(
    ns("EFPListRegistry:Transfer"),
    async function handleEFPListTokenTransfer({ context, event }) {
      const { tokenId, from: fromAddress, to: toAddress } = event.args;

      // The mint event represents the transfer of ownership of
      // an EFP List token from the zeroAddress to the new owner's address.
      if (fromAddress === zeroAddress) {
        // Create a new EFP List Token with the owner initialized as the token recipient
        await context.db.insert(efp_listToken).values({
          id: tokenId,
          owner: parseEvmAddress(toAddress),
        });
      }

      // The burn event represents the transfer of ownership of
      // an EFP List token from the owner's address to the zero address.
      else if (toAddress === zeroAddress) {
        // Delete the burnt EFP List Token
        await context.db.delete(efp_listToken, { id: tokenId });
      }

      // If the transfer is not from the zeroAddress,
      // and the transfer is not to the zeroAddress,
      // this transfer represents an ownership change.
      else {
        // Update the owner of the the List Token that changed ownership
        await context.db.update(efp_listToken, { id: tokenId }).set({
          owner: parseEvmAddress(toAddress),
        });
      }
    },
  );

  ponder.on(
    ns("EFPListRegistry:UpdateListStorageLocation"),
    async function handleEFPListStorageLocationUpdate({ context, event }) {
      const { listStorageLocation: encodedListStorageLocation, tokenId } = event.args;
      const listToken = await context.db.find(efp_listToken, { id: tokenId });

      // invariant: List Token must exist before its List Storage Location can be updated
      if (!listToken) {
        throw new Error(
          `Cannot update List Storage Location for nonexisting List Token (id: ${tokenId})`,
        );
      }

      const encodedLsl = parseEncodedLsl(encodedListStorageLocation);
      const lslId = encodedLsl;

      // Update the List Token with the new List Storage Location
      await context.db.update(efp_listToken, { id: tokenId }).set({
        lslId,
      });

      // Update the List Storage Location associated with the List Token
      // if the List Storage Location is in a recognized format
      if (isEncodedLslContract(encodedLsl)) {
        try {
          const lslContract = decodeListStorageLocationContract(config.namespace, encodedLsl);

          // Index the decoded List Storage Location data with a reference to the List Token
          // created with the currently handled EVM event.
          // Note: if the List Storage Location with the same ID already exists,
          // no new changes will be made to the database.
          await context.db
            .insert(efp_listStorageLocation)
            .values({
              id: lslId,
              chainId: lslContract.chainId,
              listRecordsAddress: lslContract.listRecordsAddress,
              slot: lslContract.slot,
            })
            .onConflictDoNothing();
        } catch {
          // The `encodedLsl` value could not be decoded.
          // We can ignore this case, as we have already captured the `encodedLsl` value
          // in the `efp_listToken` table as the `lslId` value.
        }
      }
    },
  );
}
