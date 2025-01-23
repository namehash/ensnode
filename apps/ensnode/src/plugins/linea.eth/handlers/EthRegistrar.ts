import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { makeSubnodeNamehash, tokenIdToLabel } from "ensnode-utils/subname-helpers";
import { zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { upsertAccount } from "../../../lib/db-helpers";
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
  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    const { tokenId, from, to } = event.args;

    if (event.args.from === zeroAddress) {
      // Each domain must reference an account of its owner,
      // so we ensure the account exists before inserting the domain
      await upsertAccount(context, to);
      // The ens-subgraph `handleNameTransferred` handler implementation
      // assumes an indexed record for the domain already exists. However,
      // when an NFT token is minted (transferred from `0x0` address),
      // there's no domain entity in the database yet. That very first transfer
      // event has to ensure the domain entity for the requested token ID
      // has been inserted into the database. This is a workaround to meet
      // expectations of the `handleNameTransferred` subgraph implementation.
      await context.db
        .insert(schema.domain)
        .values({
          id: makeSubnodeNamehash(ownedSubnameNode, tokenIdToLabel(tokenId)),
          ownerId: to,
          createdAt: event.block.timestamp,
        })
        // ensure existing domain entity in database has its owner updated
        .onConflictDoUpdate({ ownerId: to });
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
