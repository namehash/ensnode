import type { Node } from "@ensnode/utils/types";
import { createConfig } from "ponder";

import { DEPLOYMENT_CONFIG } from "@/lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { healReverseAddresses } from "@/lib/ponder-helpers";

// uses the 'eth' plugin config for deployments
export const pluginName = "eth" as const;

// the Registry/Registrar handlers in this plugin manage subdomains of '.eth'
const ownedName = "eth" as const;

// namehash('addr.reverse')
const reverseRootNode: Node = "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = createPluginNamespace(ownedName);

// `eth` plugin can heal reverse addresses from its reverse root node
const canHealReverseAddressFromParentNode = (parentNode: Node): boolean => {
  const isReverseRootNode = (maybeReverseRootNode: Node): boolean =>
    maybeReverseRootNode.toLowerCase() === reverseRootNode.toLowerCase();

  return healReverseAddresses() && isReverseRootNode(parentNode);
};

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("RegistryOld")]: {
      network: networkConfigForContract(chain, contracts.RegistryOld),
      abi: contracts.Registry.abi,
    },
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
    [namespace("EthRegistrarControllerOld")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarControllerOld),
      abi: contracts.EthRegistrarControllerOld.abi,
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
  canHealReverseAddressFromParentNode,
  ownedName,
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
