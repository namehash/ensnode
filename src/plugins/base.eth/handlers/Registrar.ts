import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { upsertAccount } from "../../../lib/db-helpers";
import { makeSubnodeNamehash, tokenIdToLabel } from "../../../lib/subname-helpers";
import { ownedName, pluginNamespace } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
  ownedSubnameNode,
} = makeRegistrarHandlers(ownedName);

export default function () {
  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(pluginNamespace("BaseRegistrar:NameRegisteredWithRecord"), async ({ context, event }) =>
    handleNameRegistered({ context, event }),
  );

  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    await upsertAccount(context, event.args.owner);
    // Base has 'preminted' names via Registrar#registerOnly, which explicitly
    // does not update the Registry. This breaks a subgraph assumption, as it
    // expects a domain to exist (via Registry:NewOwner) before any
    // Registrar:NameRegistered events. We insert the domain entity here,
    // allowing the base indexer to progress.
    await context.db.insert(schema.domain).values({
      id: makeSubnodeNamehash(ownedSubnameNode, tokenIdToLabel(event.args.id)),
      ownerId: event.args.owner,
      createdAt: event.block.timestamp,
    });

    // after ensuring the domain exists, continue with the standard handler
    return handleNameRegistered({ context, event });
  });
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    // base.eth's BaseRegistrar uses `id` instead of `tokenId`
    const { id: tokenId, from, to } = event.args;

    if (event.args.from === zeroAddress) {
      // The ens-subgraph `handleNameTransferred` handler implementation
      // assumes an indexed record for the domain already exists. However,
      // when an NFT token is minted (transferred from `0x0` address),
      // there's no domain entity in the database yet. That very first transfer
      // event has to ensure the domain entity for the requested token ID
      // has been inserted into the database. This is a workaround to meet
      // expectations of the `handleNameTransferred` subgraph implementation.
      await context.db.insert(schema.domain).values({
        id: makeSubnodeNamehash(ownedSubnameNode, tokenIdToLabel(tokenId)),
        ownerId: to,
        createdAt: event.block.timestamp,
      });
    }

    await handleNameTransferred({
      context,
      args: { from, to, tokenId },
    });
  });

  ponder.on(pluginNamespace("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    await handleNameRegisteredByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });

  ponder.on(pluginNamespace("RegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    await handleNameRegisteredByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });

  ponder.on(pluginNamespace("RegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });
}
