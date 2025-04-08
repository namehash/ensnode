import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import {ENSDeployments} from "@ensnode/ens-deployments";
import { type Labelhash } from "@ensnode/utils";
import { makeSubnodeNamehash, uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import { decodeEventLog, namehash, zeroAddress } from "viem";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { upsertAccount } from "@/lib/db-helpers";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";

/**
 * When direct subnames of base.eth are registered through the base.eth RegistrarController contract
 * on Base a NFT is minted that tokenizes ownership of the registration. The minted NFT will be
 * assigned a unique tokenId represented as uint256(labelhash(label)) where label is the direct
 * subname of base.eth that was registered.
 * https://github.com/base/basenames/blob/1b5c1ad/src/L2/RegistrarController.sol#L488
 */
const tokenIdToLabelhash = (tokenId: bigint): Labelhash => uint256ToHex32(tokenId);

export default function ({
  pluginName,
  registrarManagedName,
  namespace,
}: PonderENSPluginHandlerArgs<"base">) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    eventIdPrefix: pluginName,
    registrarManagedName,
  });

  const registrarManagedNode = namehash(registrarManagedName);

  // support NameRegisteredWithRecord for BaseRegistrar as it used by Base's RegistrarControllers
  ponder.on(namespace("BaseRegistrar:NameRegisteredWithRecord"), async ({ context, event }) => {
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
          id: makeSubnodeNamehash(registrarManagedNode, labelhash),
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

  ponder.on(namespace("EARegistrarController:NameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRegistered",
      abi: ENSDeployments.mainnet.base.contracts.EARegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...args, cost: 0n } },
    });
  });

  ponder.on(namespace("RegistrarController:NameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRegistered",
      abi: ENSDeployments.mainnet.base.contracts.RegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRegisteredByController({
      context,
      event: { ...event, args: { ...args, cost: 0n } },
    });
  });

  ponder.on(namespace("RegistrarController:NameRenewed"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRenewed",
      abi: ENSDeployments.mainnet.base.contracts.RegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRenewedByController({
      context,
      event: { ...event, args: { ...args, cost: 0n } },
    });
  });
}
