import config from "@/config";

import {
  type AccountId,
  DEFAULT_EVM_COIN_TYPE,
  makeResolverId,
  type Node,
  type ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import { staticResolverImplementsAddressRecordDefaulting } from "@ensnode/ensnode-sdk/internal";

import { db } from "@/lib/db";
import type { IndexedResolverRecords } from "@/lib/resolution/make-records-response";

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getRecordsFromIndex<SELECTION extends ResolverRecordsSelection>({
  resolver: _resolver,
  node,
  selection,
}: {
  resolver: AccountId;
  node: Node;
  selection: SELECTION;
}): Promise<IndexedResolverRecords | null> {
  const resolver = await db.query.resolver.findFirst({
    where: (t, { eq }) => eq(t.id, makeResolverId(_resolver)),
  });

  if (!resolver) return null;

  const records = await db.query.resolverRecords.findFirst({
    where: (resolver, { and, eq }) =>
      and(
        eq(resolver.chainId, resolver.chainId),
        eq(resolver.address, resolver.address),
        eq(resolver.node, node),
      ),
    columns: { name: true },
    with: { addressRecords: true, textRecords: true },
  });

  const resolverRecords = records as IndexedResolverRecords | undefined;

  if (!resolverRecords) return null;

  // if the resolver implements address record defaulting, materialize all selected address records
  // that do not yet exist
  if (staticResolverImplementsAddressRecordDefaulting(config.namespace, resolver)) {
    if (selection.addresses) {
      const defaultRecord = resolverRecords.addressRecords.find(
        (record) => record.coinType === DEFAULT_EVM_COIN_TYPE_BIGINT,
      );

      for (const coinType of selection.addresses) {
        const _coinType = BigInt(coinType);
        const existing = resolverRecords.addressRecords.find(
          (record) => record.coinType === _coinType,
        );
        if (!existing && defaultRecord) {
          resolverRecords.addressRecords.push({
            value: defaultRecord.value,
            coinType: _coinType,
          });
        }
      }
    }
  }

  return resolverRecords;
}
