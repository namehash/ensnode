import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";
import { namehash } from "viem/ens";

import config from "@/config";
import { namespaceContract } from "@/lib/plugin-helpers";
import { getRegistrarManagedName, tokenIdToLabelHash } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Subregistry;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));

  ponder.on(
    namespaceContract(pluginName, "BaseEth_BaseRegistrar:ControllerAdded"),
    async ({ context, event }) => {
      await context.db.insert(schema.subregistry_registrar_controller).values({
        address: event.args.controller,
        baseRegistrarAddress: event.log.address,
        addedAt: event.block.timestamp,
        chainId: context.chain.id,
        transactionHash: event.transaction.hash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseEth_BaseRegistrar:ControllerRemoved"),
    async ({ context, event }) => {
      await context.db
        .update(schema.subregistry_registrar_controller, { address: event.args.controller })
        .set({
          removedAt: event.block.timestamp,
        });
    },
  );

  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(
    namespaceContract(pluginName, "BaseEth_BaseRegistrar:NameRegisteredWithRecord"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;

      // Upsert the Subregistry Registration record
      // This record represents the current registration state for the `node`.
      await context.db
        .insert(schema.subregistry_registration)
        .values({
          node,
          parentNode,
          expiresAt,
        })
        // in case the record already exists, it means the name was re-registered
        // after expiry, so we update the expiresAt field
        .onConflictDoUpdate({
          expiresAt,
        });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseEth_BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;

      // Upsert the Subregistry Registration record
      // This record represents the current registration state for the `node`.
      await context.db
        .insert(schema.subregistry_registration)
        .values({
          node,
          parentNode,
          expiresAt,
        })
        // in case the record already exists, it means the name was re-registered
        // after expiry, so we update the expiresAt field
        .onConflictDoUpdate({
          expiresAt,
        });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseEth_BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = event.args.expires;

      // Update the Subregistry Registration record
      // This record represents the current registration state for the `node`.
      await context.db
        .update(schema.subregistry_registration, {
          node,
        })
        .set({
          expiresAt,
        });
    },
  );
}
