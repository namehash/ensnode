import { DatasourceName, ENSNamespaceId, maybeGetDatasource } from "@ensnode/datasources";
import { AccountId } from "@ensnode/ensnode-sdk";

/**
 * Gets the AccountId for the contract in the specified namespace, datasource, and
 * contract name, or undefined if it is not defined or is not a single AccountId.
 *
 * This is useful when you want to retrieve the AccountId for a contract by its name
 * where it may or may not actually be defined for the given namespace and datasource.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *                      'ens-test-env')
 * @param datasourceName - The name of the Datasource to search for contractName in
 * @param contractName - The name of the contract to retrieve
 * @returns The AccountId of the contract with the given namespace, datasource,
 *          and contract name, or undefined if it is not found or is not a single AccountId
 */
export const maybeGetDatasourceContract = (
  namespaceId: ENSNamespaceId,
  datasourceName: DatasourceName,
  contractName: string,
): AccountId | undefined => {
  const datasource = maybeGetDatasource(namespaceId, datasourceName);
  if (!datasource) return undefined;

  const address = datasource.contracts[contractName]?.address;
  if (address === undefined || Array.isArray(address)) return undefined;

  return {
    chainId: datasource.chain.id,
    address,
  };
};

/**
 * Gets the AccountId for the contract in the specified namespace, datasource, and
 * contract name, or throws an error if it is not defined or is not a single AccountId.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *                      'ens-test-env')
 * @param datasourceName - The name of the Datasource to search for contractName in
 * @param contractName - The name of the contract to retrieve
 * @returns The AccountId of the contract with the given namespace, datasource,
 *          and contract name
 * @throws Error if the contract is not found or is not a single AccountId
 */
export const getDatasourceContract = (
  namespaceId: ENSNamespaceId,
  datasourceName: DatasourceName,
  contractName: string,
): AccountId => {
  const contract = maybeGetDatasourceContract(namespaceId, datasourceName, contractName);
  if (!contract) {
    throw new Error(
      `Expected contract not found for ${namespaceId} ${datasourceName} ${contractName}`,
    );
  }
  return contract;
};
