import config from "@/config";

import { type AccountId, DEFAULT_EVM_COIN_TYPE, type Node } from "enssdk";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import { staticResolverImplementsAddressRecordDefaulting } from "@ensnode/ensnode-sdk/internal";

import { ensDb } from "@/lib/ensdb/singleton";

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getRecordsFromIndex<SELECTION extends ResolverRecordsSelection>({
  resolver,
  node,
  selection,
}: {
  resolver: AccountId;
  node: Node;
  selection: SELECTION;
}) {
  const row = await ensDb.query.resolverRecords.findFirst({
    where: (t, { and, eq }) =>
      and(
        // by (chainId, address, node)
        eq(t.chainId, resolver.chainId),
        eq(t.address, resolver.address),
        eq(t.node, node),
      ),
    columns: {
      name: true,
      contenthash: true,
      pubkeyX: true,
      pubkeyY: true,
      dnszonehash: true,
      version: true,
    },
    with: { addressRecords: true, textRecords: true },
  });

  // coalesce undefined to null
  if (!row) return null;

  const implementsAddressRecordDefaulting = staticResolverImplementsAddressRecordDefaulting(
    config.namespace,
    resolver,
  );

  if (implementsAddressRecordDefaulting && selection.addresses) {
    // materialize any selected address record that isn't yet in the index, defaulting
    // to the DEFAULT_EVM_COIN_TYPE record's value, if exists
    const defaultRecord = row.addressRecords.find(
      (record) => record.coinType === DEFAULT_EVM_COIN_TYPE_BIGINT,
    );
    if (defaultRecord) {
      for (const coinType of selection.addresses) {
        const _coinType = BigInt(coinType);
        const existing = row.addressRecords.find((record) => record.coinType === _coinType);
        if (!existing) row.addressRecords.push({ ...defaultRecord, coinType: _coinType });
      }
    }
  }

  return row;
}
