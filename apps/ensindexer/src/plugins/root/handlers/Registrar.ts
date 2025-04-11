import { ponder } from "ponder:registry";
import { ENSDeployments } from "@ensnode/ens-deployments";
import { type LabelHash } from "@ensnode/utils";
import { uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import { decodeEventLog } from "viem";

import { makeRegistrarHandlers } from "@/handlers/Registrar";
import { PonderENSPluginHandlerArgs } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";

/**
 * When direct subnames of .eth are registered through the ETHRegistrarController contract on
 * Ethereum mainnet, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId which is uint256(labelhash(label)) where label is the
 * direct subname of .eth that was registered.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

export default function ({
  pluginName,
  registrarManagedName,
  namespace,
}: PonderENSPluginHandlerArgs<PluginName.Root>) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({
    pluginName,
    eventIdPrefix: null, // NOTE: no event id prefix for root plugin (subgraph-compat)
    registrarManagedName,
  });

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
    await handleNameTransferred({
      context,
      event: {
        ...event,
        args: {
          from,
          to,
          labelHash: tokenIdToLabelHash(tokenId),
        },
      },
    });
  });

  ponder.on(namespace("EthRegistrarControllerOld:NameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRegistered",
      abi: ENSDeployments.mainnet.root.contracts.EthRegistrarControllerOld.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    // the old registrar controller just had `cost` param
    await handleNameRegisteredByController({ context, event: { ...event, args } });
  });
  ponder.on(namespace("EthRegistrarControllerOld:NameRenewed"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRenewed",
      abi: ENSDeployments.mainnet.root.contracts.EthRegistrarControllerOld.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRenewedByController({ context, event: { ...event, args } });
  });

  ponder.on(namespace("EthRegistrarController:NameRegistered"), async ({ context, event }) => {
    // NOTE(name-null-bytes): manually decode args that may contain null bytes
    const { args } = decodeEventLog({
      eventName: "NameRegistered",
      abi: ENSDeployments.mainnet.root.contracts.EthRegistrarController.abi,
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
      abi: ENSDeployments.mainnet.root.contracts.EthRegistrarController.abi,
      topics: event.log.topics,
      data: event.log.data,
    });

    await handleNameRenewedByController({ context, event: { ...event, args } });
  });
}
