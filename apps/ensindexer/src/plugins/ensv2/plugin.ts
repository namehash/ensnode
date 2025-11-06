import { createConfig } from "ponder";

import { DatasourceNames, getDatasource } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";

/**

 */
export const pluginName = PluginName.ENSv2;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.ENSRoot],
  createPonderConfig(config) {
    const ensroot = getDatasource(config.namespace, DatasourceNames.ENSRoot);

    return createConfig({
      chains: chainsConnectionConfig(config.rpcConfigs, ensroot.chain.id),

      contracts: {
        // index the RegistryOld on ENS Root Chain
        [namespaceContract(pluginName, "RegistryOld")]: {
          abi: ensroot.contracts.RegistryOld.abi,
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.RegistryOld,
            ),
          },
        },
      },
    });
  },
});
