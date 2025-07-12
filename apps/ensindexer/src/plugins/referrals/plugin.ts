/**
 * The Subgraph plugin describes indexing behavior for the 'ENSRoot' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
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

const pluginName = PluginName.Referrals;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [DatasourceNames.ENSRoot],
  createPonderConfig(config) {
    const { chain, contracts } = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ENSRoot,
    );

    return ponder.createConfig({
      chains: chainsConnectionConfig(config.rpcConfigs, chain.id),
      contracts: {
        [namespaceContract(pluginName, "UnwrappedEthRegistrarController")]: {
          chain: chainConfigForContract(
            config.globalBlockrange,
            chain.id,
            contracts.UnwrappedEthRegistrarController,
          ),
          abi: contracts.UnwrappedEthRegistrarController.abi,
        },
      },
    });
  },
});
