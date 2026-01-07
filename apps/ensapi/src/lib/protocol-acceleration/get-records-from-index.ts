import config from "@/config";

import {
  type AccountId,
  DEFAULT_EVM_COIN_TYPE,
  type Node,
  type ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import { staticResolverImplementsAddressRecordDefaulting } from "@ensnode/ensnode-sdk/internal";

import { db } from "@/lib/db";
import type { IndexedResolverRecords } from "@/lib/resolution/make-records-response";

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getRecordsFromIndex<SELECTION extends ResolverRecordsSelection>({
  resolver,
  node,
  selection,
}: {
  resolver: AccountId;
  node: Node;
  selection: SELECTION;
}): Promise<IndexedResolverRecords | null> {
  const records = (await db.query.resolverRecords.findFirst({
    where: (t, { and, eq }) =>
      and(
        // filter by specific resolver
        eq(t.chainId, resolver.chainId),
        eq(t.address, resolver.address),
        // filter by specific node
        eq(t.node, node),
      ),
    columns: { name: true },
    with: { addressRecords: true, textRecords: true },
  })) as IndexedResolverRecords | undefined;

  // no records found
  if (!records) return null;

  // if the resolver doesn't implement address record defaulting, return records as-is
  if (!staticResolverImplementsAddressRecordDefaulting(config.namespace, resolver)) return records;

  // otherwise, materialize all selected address records that do not yet exist
  if (selection.addresses) {
    const defaultRecord = records.addressRecords.find(
      (record) => record.coinType === DEFAULT_EVM_COIN_TYPE_BIGINT,
    );

    for (const coinType of selection.addresses) {
      const _coinType = BigInt(coinType);
      const existing = records.addressRecords.find((record) => record.coinType === _coinType);
      if (!existing && defaultRecord) {
        records.addressRecords.push({
          value: defaultRecord.value,
          coinType: _coinType,
        });
      }
    }
  }

  return records;
}
