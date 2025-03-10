import { ponder } from "ponder:registry";
import { uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import type { Labelhash } from "@ensnode/utils/types";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

/**
 * When direct subnames of .eth are registered through the ETHRegistrarController contract on
 * Ethereum mainnet, a NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId represented as uint256(labelhash(label)) where label is the
 * direct subname of .eth that was registered.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
const tokenIdToLabelhash = (tokenId: bigint): Labelhash => uint256ToHex32(tokenId);

export default function ({ ownedName, namespace }: PonderENSPluginHandlerArgs<"eth">) {
  const {
    handleNameRegistered,
    handleNameRegisteredByController,
    handleNameRenewedByController,
    handleNameRenewed,
    handleNameTransferred,
  } = makeRegistrarHandlers({ ownedName });

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
    await handleNameTransferred({
      context,
      event: {
        ...event,
        args: {
          from,
          to,
          labelhash: tokenIdToLabelhash(tokenId),
        },
      },
    });
  });

  ponder.on(namespace("EthRegistrarControllerOld:NameRegistered"), async ({ context, event }) => {
    // the old registrar controller just had `cost` param
    await handleNameRegisteredByController({ context, event });
  });
  ponder.on(namespace("EthRegistrarControllerOld:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({ context, event });
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
