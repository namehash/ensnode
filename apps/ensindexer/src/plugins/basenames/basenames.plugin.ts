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
 * The Basenames plugin describes indexing behavior for the Basenames ENS Datasource, leveraging
 * the shared Subgraph-compatible indexing logic.
 */
const pluginName = PluginName.Basenames;

// construct a unique contract namespace for this plugin
const namespace = makePluginNamespace(pluginName);

export const plugin = {
  pluginName,
  get config() {
    // extract the chain and contract configs for Basenames Datasource in order to build ponder config
    const deployment = getENSDeployment(config.ensDeploymentChain);
    const { chain, contracts } = deployment[DatasourceName.Basenames];

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
        [namespace("EARegistrarController")]: {
          network: networkConfigForContract(chain, contracts.EARegistrarController),
          abi: contracts.EARegistrarController.abi,
        },
        [namespace("RegistrarController")]: {
          network: networkConfigForContract(chain, contracts.RegistrarController),
          abi: contracts.RegistrarController.abi,
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
      import("@/plugins/multi-network/Resolver"),
    ],
  }),
} as const satisfies ENSIndexerPlugin<PluginName.Basenames>;
