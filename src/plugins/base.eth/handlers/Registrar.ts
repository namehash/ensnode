import { Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { Block } from "ponder";
import { Hex, zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { ensureDomainExists, upsertAccount } from "../../../lib/db-helpers";
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
    // base has 'preminted' names via Registrar#registerOnly, which explicitly does not update Registry.
    // this breaks a subgraph assumption, as it expects a domain to exist (via Registry:NewOwner) before
    // any Registrar:NameRegistered events. in the future we will likely happily upsert domains, but
    // in order to avoid prematurely drifting from subgraph equivalancy, we upsert the domain here,
    // allowing the base indexer to progress.
    await ensureDomainExists(context, {
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
      // assumes the domain record exists. However, when an NFT token is
      // minted, there's no domain entity in the database yet. The very first
      // transfer event has to ensure the domain entity for the requested
      // token ID has been inserted into the database. This is a workaround to
      // meet expectations of the `handleNameTransferred` subgraph
      // implementation.
      await ensureDomainExists(context, {
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
