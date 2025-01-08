import { ponder } from "ponder:registry";
import { makeRegistryHandlers } from "../../../handlers/Registrar";
import { ownedSubname, pluginNamespace } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
} = makeRegistryHandlers(ownedSubname);

export default function () {
  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    return await handleNameTransferred({ context, args: event.args });
  });

  ponder.on(
    pluginNamespace("EthRegistrarControllerOld:NameRegistered"),
    async ({ context, event }) => {
      // the old registrar controller just had `cost` param
      return await handleNameRegisteredByController({ context, args: event.args });
    },
  );
  ponder.on(
    pluginNamespace("EthRegistrarControllerOld:NameRenewed"),
    async ({ context, event }) => {
      return await handleNameRenewedByController({ context, args: event.args });
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
