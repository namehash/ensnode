import { createConfig, mergeAbis } from "ponder";
import { DEPLOYMENT_CONFIG } from "../../lib/globals";
import {
  activateHandlers,
  createPluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "../../lib/plugin-helpers";

// eth plugin abis
import { BaseRegistrar as eth_BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController as eth_EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld as eth_EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver as eth_LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper as eth_NameWrapper } from "./abis/NameWrapper";
import { Registry as eth_Registry } from "./abis/Registry";
import { Resolver as eth_Resolver } from "./abis/Resolver";

// uses the 'eth' plugin config for deployments
const pluginName = "eth" as const;

// the Registry/Registrar handlers in this plugin manage subdomains of '.eth'
export const ownedName = "eth" as const;

const { chain, contracts } = DEPLOYMENT_CONFIG[pluginName];
const namespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: networksConfigForChain(chain),
  contracts: {
    [namespace("RegistryOld")]: {
      network: networkConfigForContract(chain, contracts.RegistryOld),
      abi: eth_Registry,
    },
    [namespace("Registry")]: {
      network: networkConfigForContract(chain, contracts.Registry),
      abi: eth_Registry,
    },
    [namespace("Resolver")]: {
      network: networkConfigForContract(chain, contracts.Resolver),
      abi: mergeAbis([eth_LegacyPublicResolver, eth_Resolver]),
      // NOTE: this indexes every event ever emitted that looks like this
      filter: [
        { event: "AddrChanged", args: {} },
        { event: "AddressChanged", args: {} },
        { event: "NameChanged", args: {} },
        { event: "ABIChanged", args: {} },
        { event: "PubkeyChanged", args: {} },
        {
          event: "TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
          args: {},
        },
        {
          event:
            "TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
          args: {},
        },
        { event: "ContenthashChanged", args: {} },
        { event: "InterfaceChanged", args: {} },
        { event: "AuthorisationChanged", args: {} },
        { event: "VersionChanged", args: {} },
        { event: "DNSRecordChanged", args: {} },
        { event: "DNSRecordDeleted", args: {} },
        { event: "DNSZonehashChanged", args: {} },
      ],
    },
    [namespace("BaseRegistrar")]: {
      network: networkConfigForContract(chain, contracts.BaseRegistrar),
      abi: eth_BaseRegistrar,
    },
    [namespace("EthRegistrarControllerOld")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarControllerOld),
      abi: eth_EthRegistrarControllerOld,
    },
    [namespace("EthRegistrarController")]: {
      network: networkConfigForContract(chain, contracts.EthRegistrarController),
      abi: eth_EthRegistrarController,
    },
    [namespace("NameWrapper")]: {
      network: networkConfigForContract(chain, contracts.NameWrapper),
      abi: eth_NameWrapper,
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
