import { createConfig } from "ponder";

import config from "@/config";
import {
  ENSIndexerPlugin,
  activateHandlers,
  makePluginNamespace,
  networkConfigForContract,
  networksConfigForChain,
} from "@/lib/plugin-helpers";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * The Lineanames plugin describes indexing behavior for the Lineanames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
const pluginName = PluginName.Lineanames;

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

export default {
  pluginName,
  get config() {
    // extract the chain and contract configs for Lineanames Datasource in order to build ponder config
    const deployment = getENSDeployment(config.ensDeploymentChain);
    const { chain, contracts } = deployment[DatasourceName.Lineanames];

    return createConfig({
      networks: networksConfigForChain(chain.id),
      contracts: {
        [namespace("Registry")]: {
          network: networkConfigForContract(chain, contracts.Registry),
          abi: contracts.Registry.abi,
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
        Resolver: {
          network: networkConfigForContract(chain, contracts.Resolver),
          abi: contracts.Resolver.abi,
        },
      },
    });
  },
  activate: activateHandlers({
    pluginName,
    namespace,
    handlers: [
      import("./handlers/Registry"),
      import("./handlers/Registrar"),
      import("./handlers/NameWrapper"),
      import("@/plugins/multi-network/Resolver"),
    ],
  }),
} as const satisfies ENSIndexerPlugin<PluginName.Lineanames>;
