import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { ENSDeployments } from "@ensnode/ens-deployments";
import { type LabelHash } from "@ensnode/utils";
import { makeSubdomainNode, uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import { decodeEventLog, namehash, zeroAddress } from "viem";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { upsertAccount } from "@/lib/db-helpers";
import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

/**
 * When direct subnames of linea.eth are registered through the linea.eth ETHRegistrarController
 * contract on Linea, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId represented as uint256(labelhash(label)) where label is the
 * direct subname of linea.eth that was registered.
 * https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

export default function ({
  pluginName,
  registrarManagedName,
  namespace,
}: ENSIndexerPluginHandlerArgs<PluginName.Lineanames>) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    pluginName,
    registrarManagedName,
  });

  const registrarManagedNode = namehash(registrarManagedName);

  ponder.on(namespace("BaseRegistrar:NameRegistered"), async ({ context, event }) => {
    await handleNameRegistered({
      context,
      event: {
        ...event,
        args: {
          ...event.args,
          labelHash: tokenIdToLabelHash(event.args.id),
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
          labelHash: tokenIdToLabelHash(event.args.id),
        },
      },
    });
  });

  ponder.on(namespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    const { tokenId, from, to } = event.args;

    const labelHash = tokenIdToLabelHash(tokenId);

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
          id: makeSubdomainNode(labelHash, registrarManagedNode),
          ownerId: to,
          createdAt: event.block.timestamp,
        })
        // ensure existing domain entity in database has its owner updated
        .onConflictDoUpdate({ ownerId: to });
    }

    await handleNameTransferred({
      context,
      event: { ...event, args: { from, to, labelHash } },
    });
  });

  ponder.on(namespace("EthRegistrarController:OwnerNameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "OwnerNameRegistered",
      abi: ENSDeployments.mainnet.lineanames.contracts.EthRegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...args,
          // Linea allows the owner of the EthRegistrarController to register subnames for free
          cost: 0n,
        },
      },
    });
  });

  ponder.on(namespace("EthRegistrarController:PohNameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "PohNameRegistered",
      abi: ENSDeployments.mainnet.lineanames.contracts.EthRegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...args,
          // Linea allows any wallet address holding a Proof of Humanity (Poh) to register one subname for free
          cost: 0n,
        },
      },
    });
  });

  ponder.on(namespace("EthRegistrarController:NameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRegistered",
      abi: ENSDeployments.mainnet.lineanames.contracts.EthRegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRegisteredByController({
      context,
      event: {
        ...event,
        args: {
          ...args,
          // the new registrar controller uses baseCost + premium to compute cost
          cost: args.baseCost + args.premium,
        },
      },
    });
  });
  ponder.on(namespace("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRenewed",
      abi: ENSDeployments.mainnet.lineanames.contracts.EthRegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRenewedByController({ context, event: { ...event, args } });
  });
}
