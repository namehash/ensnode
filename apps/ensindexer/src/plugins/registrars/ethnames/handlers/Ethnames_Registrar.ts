import config from "@/config";

import { ponder } from "ponder:registry";
import { namehash } from "viem/ens";

import { DatasourceNames } from "@ensnode/datasources";
import {
  type BlockRef,
  bigIntToNumber,
  makeSubdomainNode,
  PluginName,
  type Subregistry,
} from "@ensnode/ensnode-sdk";

import { getDatasourceContract } from "@/lib/datasource-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";

import {
  handleRegistrarEventRegistration,
  handleRegistrarEventRenewal,
} from "../../shared/lib/registrar-events";
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
  } satisfies Subregistry;

  ponder.on(
    namespaceContract(pluginName, "Ethnames_BaseRegistrar:NameRegistered"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const registrant = event.transaction.from;
      const expiresAt = bigIntToNumber(event.args.expires);
      const block = {
        number: bigIntToNumber(event.block.number),
        timestamp: bigIntToNumber(event.block.timestamp),
      } satisfies BlockRef;
      const transactionHash = event.transaction.hash;

      await upsertSubregistry(context, subregistry);

      await handleRegistrarEventRegistration(context, {
        id,
        subregistryId,
        node,
        registrant,
        expiresAt,
        block,
        transactionHash,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Ethnames_BaseRegistrar:NameRenewed"),
    async ({ context, event }) => {
      const id = event.id;
      const labelHash = tokenIdToLabelHash(event.args.id);
      const node = makeSubdomainNode(labelHash, parentNode);
      const registrant = event.transaction.from;
      const expiresAt = bigIntToNumber(event.args.expires);
      const block = {
        number: bigIntToNumber(event.block.number),
        timestamp: bigIntToNumber(event.block.timestamp),
      } satisfies BlockRef;
      const transactionHash = event.transaction.hash;

      await handleRegistrarEventRenewal(context, {
        id,
        subregistryId,
        node,
        registrant,
        expiresAt,
        block,
        transactionHash,
      });
    },
  );
}
