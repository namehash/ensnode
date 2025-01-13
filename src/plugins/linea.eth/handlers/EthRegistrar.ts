import { type Context, ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { type Block } from "ponder";
import { Hex, zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
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
  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    const { tokenId, from, to } = event.args;

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
          args: { id: tokenId, owner: to },
        },
      });
    }

    await handleNameTransferred({
      context,
      args: { from, to, tokenId },
    });
  });

  // Linea allows the owner of the EthRegistrarController to register subnames for free
  ponder.on(
    pluginNamespace("EthRegistrarController:OwnerNameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        args: {
          ...event.args,
          cost: 0n,
        },
      });
    },
  );

  // Linea allows any wallet address holding a Proof of Humanity (Poh) to register one subname for free
  ponder.on(
    pluginNamespace("EthRegistrarController:PohNameRegistered"),
    async ({ context, event }) => {
      await handleNameRegisteredByController({
        context,
        args: {
          ...event.args,
          cost: 0n,
        },
      });
    },
  );

  ponder.on(
    pluginNamespace("EthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
      // the new registrar controller uses baseCost + premium to compute cost
      await handleNameRegisteredByController({
        context,
        args: {
          ...event.args,
          cost: event.args.baseCost + event.args.premium,
        },
      });
    },
  );
  ponder.on(pluginNamespace("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({ context, args: event.args });
  });
}
