import { type ChainId, type NormalizedAddress, toNormalizedAddress } from "enssdk";

import type { ContractConfig, Datasource, DatasourceName, ENSNamespaceId } from "./lib/types";
import { getENSNamespace } from "./namespaces";

/** A query for {@link identifyDatasourceContracts}: an address, optionally scoped to one chain. */
export interface DatasourceIdentifyQuery {
  /** When set, only consider Datasources deployed on this chain. */
  chainId?: ChainId;
  address: NormalizedAddress;
}

/** A well-known Datasource contract matched by {@link identifyDatasourceContracts}. */
export interface DatasourceContractMatch {
  namespace: ENSNamespaceId;
  datasource: DatasourceName;
  contract: string;
  chainId: ChainId;
  address: NormalizedAddress;
}

/**
 * Finds every well-known contract in `namespaceId`'s Datasources whose address equals
 * `query.address`, optionally restricted to `query.chainId`.
 *
 * Contracts without a fixed address (matched onchain by event only) are skipped — they have no
 * address to identify. A single address may match multiple contracts, so all matches are returned.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'ens-test-env')
 * @param query - The address to identify, optionally scoped to a chain
 */
export const identifyDatasourceContracts = (
  namespaceId: ENSNamespaceId,
  query: DatasourceIdentifyQuery,
): DatasourceContractMatch[] => {
  const matches: DatasourceContractMatch[] = [];

  for (const [datasourceName, datasource] of Object.entries(getENSNamespace(namespaceId)) as [
    DatasourceName,
    Datasource,
  ][]) {
    if (query.chainId !== undefined && datasource.chain.id !== query.chainId) continue;

    for (const [contractName, contract] of Object.entries(datasource.contracts) as [
      string,
      ContractConfig,
    ][]) {
      // Skip event-filter-only contracts: with no fixed address there is nothing to identify.
      if (contract.address === undefined) continue;

      const addresses = Array.isArray(contract.address) ? contract.address : [contract.address];
      if (addresses.some((address) => toNormalizedAddress(address) === query.address)) {
        matches.push({
          namespace: namespaceId,
          datasource: datasourceName,
          contract: contractName,
          chainId: datasource.chain.id,
          address: query.address,
        });
      }
    }
  }

  return matches;
};
