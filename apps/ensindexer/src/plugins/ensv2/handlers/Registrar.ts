import config from "@/config";

import { type Context, ponder } from "ponder:registry";
import type { Address } from "viem";

import { DatasourceNames } from "@ensnode/datasources";
import { type AccountId, accountIdEqual, PluginName } from "@ensnode/ensnode-sdk";

import { getDatasourceContract, maybeGetDatasourceContract } from "@/lib/datasource-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

const ethnamesRegistrar = getDatasourceContract(
  config.namespace,
  DatasourceNames.ENSRoot,
  "BaseRegistrar",
);
const basenamesRegistar = maybeGetDatasourceContract(
  config.namespace,
  DatasourceNames.Basenames,
  "BaseRegistrar",
);
const lineanamesRegistar = maybeGetDatasourceContract(
  config.namespace,
  DatasourceNames.Lineanames,
  "BaseRegistrar",
);

const getRegistrarManagedName = (registrar: AccountId) => {
  if (accountIdEqual(ethnamesRegistrar, registrar)) return "eth";
  if (basenamesRegistar && accountIdEqual(basenamesRegistar, registrar)) return "base.eth";
  if (lineanamesRegistar && accountIdEqual(lineanamesRegistar, registrar)) return "linea.eth";
  throw new Error("never");
};

export default function () {
  //////////////
  // Registrars
  //////////////
  ponder.on(
    namespaceContract(pluginName, "Registrar:NameRegistered"),
    async ({ context, event }) => {
      // upsert relevant registration for domain
    },
  );

  ponder.on(
    namespaceContract(pluginName, "Registrar:NameRegisteredWithRecord"),
    async ({ context, event }) => {
      // upsert relevant registration for domain
    },
  );

  ponder.on(namespaceContract(pluginName, "Registrar:NameRenewed"), async ({ context, event }) => {
    // update registration expiration, add renewal log
  });

  ponder.on(namespaceContract(pluginName, "Registrar:NameMigrated"), async ({ context, event }) => {
    // TODO: what does this mean and from where?
  });

  async function handleTransfer({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      from: Address;
      to: Address;
      tokenId: bigint;
    }>;
  }) {
    //
  }

  ponder.on(
    namespaceContract(
      pluginName,
      "Registrar:Transfer(address indexed from, address indexed to, uint256 indexed id)",
    ),
    ({ context, event }) =>
      handleTransfer({
        context,
        event: { ...event, args: { ...event.args, tokenId: event.args.id } },
      }),
  );

  ponder.on(
    namespaceContract(
      pluginName,
      "Registrar:Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    ),
    handleTransfer,
  );
}
