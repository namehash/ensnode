/**
 * The Seaport plugin describes indexing behavior for Seaport contracts on all supported networks.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainConnectionConfig } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

const pluginName = PluginName.Seaport;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.Seaport],
  createPonderConfig(config) {
    const seaport = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Seaport,
    );

    return ponder.createConfig({
      chains: {
        ...chainConnectionConfig(config.rpcConfigs, seaport.chain.id),
      },
      contracts: {
        [namespaceContract(pluginName, "Seaport")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              seaport.chain.id,
              seaport.contracts.Seaport,
            ),
          },
          abi: seaport.contracts.Seaport.abi,
        },
      },
    });
  },
});
