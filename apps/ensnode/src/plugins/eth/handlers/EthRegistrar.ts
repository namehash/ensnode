import { ponder } from "ponder:registry";
import { uint256ToHex32 } from "ensnode-utils/subname-helpers";
import type { Labelhash } from "ensnode-utils/types";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { ownedName, pluginNamespace } from "../ponder.config";

/**
 * ETHRegistrarController contract's tokenId is uint256(labelhash)
 * https://github.com/ensdomains/ens-contracts/blob/mainnet/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
const tokenIdToLabelhash = (tokenId: bigint): Labelhash => uint256ToHex32(tokenId);

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
} = makeRegistrarHandlers(ownedName);

export default function () {
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

  ponder.on(
    pluginNamespace("EthRegistrarControllerOld:NameRegistered"),
    async ({ context, event }) => {
      // the old registrar controller just had `cost` param
      await handleNameRegisteredByController({ context, event });
    },
  );
  ponder.on(
    pluginNamespace("EthRegistrarControllerOld:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({ context, event });
    },
  );

  ponder.on(
    pluginNamespace("EthRegistrarController:NameRegistered"),
    async ({ context, event }) => {
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
    },
  );
  ponder.on(pluginNamespace("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    await handleNameRenewedByController({ context, event });
  });
}
