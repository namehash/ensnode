import { ponder } from "ponder:registry";
import { makeRegistryHandlers } from "../../../handlers/Registrar";
import { managedSubname, ponderNamespace } from "../ponder.config";

const {
  handleNameRegistered,
  handleNameRegisteredByController,
  handleNameRenewedByController,
  handleNameRenewed,
  handleNameTransferred,
} = makeRegistryHandlers(managedSubname);

export default function () {
  ponder.on(ponderNamespace("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(ponderNamespace("BaseRegistrar:NameRenewed"), handleNameRenewed);

  ponder.on(ponderNamespace("BaseRegistrar:Transfer"), async ({ context, event }) => {
    return await handleNameTransferred({ context, args: event.args });
  });

  ponder.on(
    ponderNamespace("EthRegistrarControllerOld:NameRegistered"),
    async ({ context, event }) => {
      // the old registrar controller just had `cost` param
      return await handleNameRegisteredByController({ context, args: event.args });
    },
  );
  ponder.on(
    ponderNamespace("EthRegistrarControllerOld:NameRenewed"),
    async ({ context, event }) => {
      return await handleNameRenewedByController({ context, args: event.args });
    },
  );

  ponder.on(
    ponderNamespace("EthRegistrarController:NameRegistered"),
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
  ponder.on(ponderNamespace("EthRegistrarController:NameRenewed"), async ({ context, event }) => {
    return await handleNameRenewedByController({ context, args: event.args });
  });
}
