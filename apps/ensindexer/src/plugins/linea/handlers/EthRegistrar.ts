import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { makeSubnodeNamehash, uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import type { LabelHash } from "@ensnode/utils/types";
import { zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { upsertAccount } from "../../../lib/db-helpers";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

/**
 * When direct subnames of linea.eth are registered through the linea.eth ETHRegistrarController
 * contract on Linea a NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId represented as uint256(labelhash(label)) where label is the
 * direct subname of linea.eth that was registered.
 * https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
const tokenIdToLabelhash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

export default function ({ ownedName, namespace }: PonderENSPluginHandlerArgs<"linea.eth">) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
    ownedSubnameNode,
  } = makeRegistrarHandlers(ownedName);

  ponder.on(namespace("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          labelhash: tokenIdToLabelhash(event.args.id),
        },
      },
    });
  });

  ponder.on(namespace("BaseRegistrar:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewed({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          labelhash: tokenIdToLabelhash(event.args.id),
        },
      },
    });
  });

  ponder.on(namespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    const { tokenId, from, to } = event.args;

    const labelhash = tokenIdToLabelhash(tokenId);

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
          id: makeSubnodeNamehash(ownedSubnameNode, labelhash),
          ownerId: to,
          createdAt: event.block.timestamp,
        })
        // ensure existing domain entity in database has its owner updated
        .onConflictDoUpdate({ ownerId: to });
    }

    await handleNameTransferred({
      context,
      event: { ...event, args: { from, to, labelhash } },
    });
  });

  // Linea allows the owner of the EthRegistrarController to register subnames for free
  ponder.on(namespace("EthRegistrarController:OwnerNameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  // Linea allows any wallet address holding a Proof of Humanity (Poh) to register one subname for free
  ponder.on(namespace("EthRegistrarController:PohNameRegistered"), async ({ context, event }) => {
    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(namespace("EthRegistrarController:NameRegistered"), async ({ context, event }) => {
    // the new registrar controller uses baseCost + premium to compute cost
    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          cost: event.args.baseCost + event.args.premium,
        },
      },
    });
  });
  ponder.on(namespace("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({ context, event });
  });
}
