import { ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { makeRegistryHandlers } from "../../../handlers/Registrar";
import { makeSubnodeNamehash, tokenIdToLabel } from "../../../lib/subname-helpers";
import { upsertAccount } from "../../../lib/upserts";
import { indexedSubname, pluginNamespace } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
  indexedSubnameNode,
} = makeRegistryHandlers(indexedSubname);

export default function () {
  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(pluginNamespace("BaseRegistrar:NameRegisteredWithRecord"), async ({ context, event }) =>
    handleNameRegistered({ context, event }),
  );

  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    // base has 'preminted' names via Registrar#registerOnly, which explicitly does not update Registry.
    // this breaks a subgraph assumption, as it expects a domain to exist (via Registry:NewOwner) before
    // any Registrar:NameRegistered events. in the future we will likely happily upsert domains, but
    // in order to avoid prematurely drifting from subgraph equivalancy, we upsert the domain here,
    // allowing the base indexer to progress.
    const { id, owner } = event.args;
    const label = tokenIdToLabel(id);
    const node = makeSubnodeNamehash(indexedSubnameNode, label);
    await upsertAccount(context, owner);
    await context.db
      .insert(domains)
      .values({
        id: node,
        ownerId: owner,
        createdAt: event.block.timestamp,
      })
      .onConflictDoNothing();

    // after ensuring the domain exists, continue with the standard handler
    return handleNameRegistered({ context, event });
  });
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  // Base's BaseRegistrar uses `id` instead of `tokenId`
  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    return await handleNameTransferred({
      context,
      args: { ...event.args, tokenId: event.args.id },
    });
  });

  ponder.on(pluginNamespace("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    return handleNameRegisteredByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });

  ponder.on(pluginNamespace("RegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    return handleNameRegisteredByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });

  ponder.on(pluginNamespace("RegistrarController:NameRenewed"), async ({ context, event }) => {
    return handleNameRenewedByController({
      context,
      args: { ...event.args, cost: 0n },
    });
  });
}
