import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem/ens";

import { DatasourceNames } from "@ensnode/datasources";
import { bigIntToNumber, makeSubdomainNode, PluginName } from "@ensnode/ensnode-sdk";

import { getDatasourceContract } from "@/lib/datasource-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";

import { handleRegistration, handleRenewal } from "../../shared/lib/registrar-events";
import { upsertSubregistry } from "../../shared/lib/subregistry";
import { getRegistrarManagedName, tokenIdToLabelHash } from "../lib/registrar-helpers";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.Registrars;
  const parentNode = namehash(getRegistrarManagedName(config.namespace));

  const subregistryId = getDatasourceContract(
    config.namespace,
    DatasourceNames.ENSRoot,
    "BaseRegistrar",
  );
  const subregistry = {
    subregistryId,
    node: parentNode,
  };

  ponder.on(
    namespaceContract(pluginName, "Ethnames_BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = bigIntToNumber(event.args.expires);
      const registrant = event.transaction.from;

      await upsertSubregistry(context, subregistry);

      await handleRegistration(context, event, {
        subregistryId,
        node,
        expiresAt,
        registrant,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Ethnames_BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const expiresAt = bigIntToNumber(event.args.expires);
      const registrant = event.transaction.from;

      await handleRenewal(context, event, {
        subregistryId,
        node,
        expiresAt,
        registrant,
      });
    },
  );
}
