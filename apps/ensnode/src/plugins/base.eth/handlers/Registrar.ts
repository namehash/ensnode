import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { makeSubnodeNamehash, uint256ToHex32 } from "ensnode-utils/subname-helpers";
import { zeroAddress } from "viem";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { upsertAccount } from "../../../lib/db-helpers";
import { ownedName, pluginNamespace } from "../ponder.config";

/**
 * Base RegistrarController contract's tokenId is uint256(labelhash)
 * https://github.com/base-org/basenames/blob/main/src/L2/RegistrarController.sol#L488
 */
export const tokenIdToLabelhash = (tokenId: bigint) => uint256ToHex32(tokenId);

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
  ponder.on(
    pluginNamespace("BaseRegistrar:NameRegisteredWithRecord"),
    async ({ context, event }) => {
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
    },
  );

  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
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

  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), async ({ context, event }) => {
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

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    // base.eth's BaseRegistrar uses `id` instead of `tokenId`
    const { id: tokenId, from, to } = event.args;

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
      event: { ...event, args: { from, to, labelhash: labelhash } },
    });
  });

  ponder.on(pluginNamespace("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(pluginNamespace("RegistrarController:NameRegistered"), async ({ context, event }) => {
    // TODO: registration expected here

    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });

  ponder.on(pluginNamespace("RegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({
      context,
      event: { ...event, args: { ...event.args, cost: 0n } },
    });
  });
}
