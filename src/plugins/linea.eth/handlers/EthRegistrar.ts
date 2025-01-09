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
