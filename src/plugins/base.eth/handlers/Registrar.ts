import { Context, ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { Block } from "ponder";
import { Hex, zeroAddress } from "viem";
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

/**
 * Idempotent handler to insert a domain record when a new domain is
 * initialized. For example, right after an NFT token for the domain
 * is minted.
 *
 * @returns a newly created domain record
 */
function handleDomainNameInitialized({
  context,
  event,
}: {
  context: Context;
  event: { args: { id: bigint; owner: Hex }; block: Block };
}) {
  const { id, owner } = event.args;
  const label = tokenIdToLabel(id);
  const node = makeSubnodeNamehash(ownedSubnameNode, label);
  return context.db
    .insert(domains)
    .values({
      id: node,
      ownerId: owner,
      createdAt: event.block.timestamp,
    })
    .onConflictDoNothing();
}

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
    await handleDomainNameInitialized({ context, event });

    // after ensuring the domain exists, continue with the standard handler
    return handleNameRegistered({ context, event });
  });
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    const { id, from, to } = event.args;

    if (event.args.from === zeroAddress) {
      // The ens-subgraph `handleNameTransferred` handler implementation
      // assumes the domain record exists. However, when an NFT token is
      // minted, there's no domain record yet created. The very first transfer
      // event has to initialize the domain record. This is a workaround to
      // meet the subgraph implementation expectations.
      await handleDomainNameInitialized({
        context,
        event: {
          ...event,
          args: { id, owner: to },
        },
      });
    }

    // base.eth's BaseRegistrar uses `id` instead of `tokenId`
    await handleNameTransferred({
      context,
      args: { from, to, tokenId: id },
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
