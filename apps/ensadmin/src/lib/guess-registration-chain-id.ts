import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import { ChainId, ENSNamespaceId, Name } from "@ensnode/ensnode-sdk";

/**
 * NOTE: This function is a "dirty-hack".
 *
 * TODO: Update our indexed data model for registrations so that this dirty hack
 *       is no longer needed.
 *
 * @returns The ChainId of the chain that the registration occurred on, or null if it cannot be guessed.
 */
export const guessChainIdFromRegisteredName = (
  name: Name,
  namespaceId: ENSNamespaceId,
): ChainId | null => {
  const labels = name.split(".");

  if (labels.length === 3) {
    if (name.endsWith(".base.eth")) {
      // name is a direct subname of .base.eth
      // we will therefore assume it occured within Basenames.
      // NOTE: this assumption is not necessarily true, nothing technically stops
      // subnames of base.eth from occurring on the ENS root chain. And some have.
      // Therefore, this is only a "dirty-hack" approximation.
      const basenames = maybeGetDatasource(namespaceId, DatasourceNames.Basenames);

      if (basenames) return basenames.chain.id;

      // basenames is undefined for the namespace
    } else if (name.endsWith(".linea.eth")) {
      // name is a direct subname of .linea.eth
      // we will therefore assume it occured within Lineanames.
      // NOTE: this assumption is not necessarily true, nothing technically stops
      // subnames of linea.eth from occurring on the ENS root chain. And some have.
      // Therefore, this is only a "dirty-hack" approximation.
      const lineanames = maybeGetDatasource(namespaceId, DatasourceNames.Lineanames);

      if (lineanames) return lineanames.chain.id;

      // lineanames is undefined for the namespace
    }
  }

  // insufficient confidence to guess
  return null;
};
