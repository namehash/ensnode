import { ponder } from "ponder:registry";
import { domains } from "ponder:schema";
import { zeroAddress } from "viem";
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

export default function () {
  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    if (event.args.from === zeroAddress) {
      /**
       * Address the issue where in the same transaction the Transfer event occurs before the NameRegistered event.
       * Example: https://lineascan.build/tx/0x2211c5d857d16b7ac111088c57fb346ab94049cb297f02b0dda7aaf4c14d305b#eventlog
       * Code: hhttps://github.com/Consensys/linea-ens/blob/main/packages/linea-ens-contracts/contracts/ethregistrar/BaseRegistrarImplementation.sol#L155-L160
       */

      const { tokenId: id, to: owner } = event.args;
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
    return await handleNameTransferred({ context, args: event.args });
  });

  // Linea allows the owner of the EthRegistrarController to register subnames for free
  ponder.on(
    pluginNamespace("EthRegistrarController:OwnerNameRegistered"),
    async ({ context, event }) => {
      return handleNameRegisteredByController({
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
      return handleNameRegisteredByController({
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
      return await handleNameRegisteredByController({
        context,
        args: {
          ...event.args,
          cost: event.args.baseCost + event.args.premium,
        },
      });
    },
  );
  ponder.on(pluginNamespace("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    return await handleNameRenewedByController({ context, args: event.args });
  });
}
