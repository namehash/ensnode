/**
 * The TokenScope plugin describes indexing behavior for marketplace contracts (e.g. Seaport) on all supported networks.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

const pluginName = PluginName.TokenScope;

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
        ...chainsConnectionConfig(config.rpcConfigs, seaport.chain.id),
      },
      contracts: {
        [namespaceContract(pluginName, "Seaport")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              seaport.chain.id,
              seaport.contracts.Seaport1_5,
            ),
          },
          abi: seaport.contracts.Seaport1_5.abi,
        },
      },
    });
  },
});
