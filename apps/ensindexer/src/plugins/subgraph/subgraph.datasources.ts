import { DatasourceName } from "@ensnode/ens-deployments";

/**
 * The Subgraph plugin describes indexing behavior for the 'Root' Datasource, in alignment with the
 * legacy ENS Subgraph indexing logic.
 */
export const requiredDatasources = [DatasourceName.Root];
