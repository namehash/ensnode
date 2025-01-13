import { ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { makeSubnodeNamehash, tokenIdToLabel } from "../../../lib/subname-helpers";
import { upsertAccount } from "../../../lib/upserts";
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
    // base has 'preminted' names via Registrar#registerOnly, which explicitly does not update Registry.
    // this breaks a subgraph assumption, as it expects a domain to exist (via Registry:NewOwner) before
    // any Registrar:NameRegistered events. in the future we will likely happily upsert domains, but
    // in order to avoid prematurely drifting from subgraph equivalancy, we upsert the domain here,
    // allowing the base indexer to progress.
    const { id, owner } = event.args;
    const label = tokenIdToLabel(id);
    const node = makeSubnodeNamehash(ownedSubnameNode, label);
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

  // base.eth's BaseRegistrar uses `id` instead of `tokenId`
  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    if (event.args.from === zeroAddress) {
      /**
       * Address the issue where in the same transaction the Transfer event occurs before the NameRegistered event.
       * Example: https://basescan.org/tx/0x4d478a75710fb1edcfad5289b9e5ba76c4d1a0e8d897e2e89adf6d8107aadd66#eventlog
       * Code: https://github.com/base-org/basenames/blob/1b5c1ad464f061c557c33b60b1821f75dae924cc/src/L2/BaseRegistrar.sol#L272-L273
       */

      const { id, to: owner } = event.args;
      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(ownedSubnameNode, label);

      await context.db
        .insert(domains)
        .values({
          id: node,
          ownerId: owner,
          createdAt: event.block.timestamp,
        })
        .onConflictDoNothing();
    }

    await handleNameTransferred({
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
