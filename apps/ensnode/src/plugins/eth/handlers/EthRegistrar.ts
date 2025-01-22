import { ponder } from "ponder:registry";
import { makeRegistrarHandlers } from "../../../handlers/Registrar";
import { ownedName, pluginNamespace } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
} = makeRegistrarHandlers(ownedName);

export default function () {
  ponder.on(pluginNamespace("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(pluginNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(pluginNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    await handleNameTransferred({ context, args: event.args });
  });

  ponder.on(
    pluginNamespace("EthRegistrarControllerOld:NameRegistered"),
    async ({ context, event }) => {
      // the old registrar controller just had `cost` param
      await handleNameRegisteredByController({ context, args: event.args });
    },
  );
  ponder.on(
    pluginNamespace("EthRegistrarControllerOld:NameRenewed"),
    async ({ context, event }) => {
      await handleNameRenewedByController({ context, args: event.args });
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
