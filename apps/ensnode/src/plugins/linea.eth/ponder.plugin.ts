import { createConfig } from "ponder";
import { DEPLOYMENT_CONFIG } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "../../lib/plugin-helpers";

// linea plugin abis
import { BaseRegistrar as linea_BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController as linea_EthRegistrarController } from "./abis/EthRegistrarController";
import { NameWrapper as linea_NameWrapper } from "./abis/NameWrapper";
import { Registry as linea_Registry } from "./abis/Registry";
import { Resolver as linea_Resolver } from "./abis/Resolver";

// uses the 'linea' plugin config for deployments
const pluginName = "linea" as const;

// the Registry/Registrar handlers in this plugin manage subdomains of '.linea.eth'
export const ownedName = "linea.eth" as const;

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: linea_Registry,
    },
    [namespace("Resolver")]: {
      network: networkConfigForContract(chain, contracts.Resolver),
      abi: linea_Resolver,
      // NOTE: this indexes every event ever emitted that looks like this
      filter: [
        { event: "AddrChanged", args: {} },
        { event: "AddressChanged", args: {} },
        { event: "NameChanged", args: {} },
        { event: "ABIChanged", args: {} },
        { event: "PubkeyChanged", args: {} },
        { event: "TextChanged", args: {} },
        { event: "ContenthashChanged", args: {} },
        { event: "InterfaceChanged", args: {} },
        { event: "VersionChanged", args: {} },
        { event: "DNSRecordChanged", args: {} },
        { event: "DNSRecordDeleted", args: {} },
        { event: "DNSZonehashChanged", args: {} },
      ],
    },
    [namespace("BaseRegistrar")]: {
      network: networkConfigForContract(chain, contracts.BaseRegistrar),
      abi: linea_BaseRegistrar,
    },
    [namespace("EthRegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarController),
      abi: linea_EthRegistrarController,
    },
    [namespace("NameWrapper")]: {
      network: networkConfigForContract(chain, contracts.NameWrapper),
      abi: linea_NameWrapper,
    },
  },
});

export const activate = activateHandlers({
  ownedName,
  namespace,
  handlers: [
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ],
});
