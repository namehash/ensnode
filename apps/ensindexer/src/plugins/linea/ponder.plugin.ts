import type { Node } from "@ensnode/utils/types";
import { createConfig } from "ponder";
import { DEPLOYMENT_CONFIG } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "../../lib/plugin-helpers";

// uses the 'linea' plugin config for deployments
export const pluginName = "linea" as const;

// the Registry/Registrar handlers in this plugin manage subdomains of '.linea.eth'
const ownedName = "linea.eth" as const;

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = createPluginNamespace(ownedName);

// Support for healing addr.reverse subnames on Linea will be added later
const canHealReverseAddresses = () => false;

// Support for healing addr.reverse subnames on Linea will be added later
const isReverseRootNode = (node: Node): boolean => {
  throw new Error(`Cannot check if '${node} is a reverse root node on Linea`);
};

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: contracts.Registry.abi,
    },
    [namespace("Resolver")]: {
      network: networkConfigForContract(chain, contracts.Resolver),
      abi: contracts.Resolver.abi,
      // index Resolver by event signatures, not address
      filter: contracts.Resolver.filter,
    },
    [namespace("BaseRegistrar")]: {
      network: networkConfigForContract(chain, contracts.BaseRegistrar),
      abi: contracts.BaseRegistrar.abi,
    },
    [namespace("EthRegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarController),
      abi: contracts.EthRegistrarController.abi,
    },
    [namespace("NameWrapper")]: {
      network: networkConfigForContract(chain, contracts.NameWrapper),
      abi: contracts.NameWrapper.abi,
    },
  },
});

export const activate = activateHandlers({
  canHealReverseAddresses,
  isReverseRootNode,
  ownedName,
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
