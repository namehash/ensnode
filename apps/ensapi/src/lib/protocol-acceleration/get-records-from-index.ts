import { db } from "ponder:api";
import { onchainStaticResolverImplementsDefaultAddress } from "@/api/lib/protocol-acceleration/known-onchain-static-resolver";
import type { IndexedResolverRecords } from "@/api/lib/resolution/make-records-response";
import { withSpanAsync } from "@/lib/auto-span";
import {
  ChainId,
  DEFAULT_EVM_COIN_TYPE,
  Node,
  ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import { Address } from "viem";

const tracer = trace.getTracer("get-records");

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getRecordsFromIndex<SELECTION extends ResolverRecordsSelection>({
  chainId,
  resolverAddress,
  node,
  selection,
}: {
  chainId: ChainId;
  resolverAddress: Address;
  node: Node;
  selection: SELECTION;
}): Promise<IndexedResolverRecords | null> {
  // fetch the Resolver Records from index
  const resolverRecords = await withSpanAsync(tracer, "resolverRecords.findFirst", {}, async () => {
    const records = await db.query.resolverRecords.findFirst({
      where: (resolver, { and, eq }) =>
        and(
          eq(resolver.chainId, chainId),
          eq(resolver.resolver, resolverAddress),
          eq(resolver.node, node),
        ),
      columns: { name: true },
      with: { addressRecords: true, textRecords: true },
    });

    return records as IndexedResolverRecords | undefined;
  });

  if (!resolverRecords) return null;

  // if the resolver implements address record defaulting, materialize all selected address records
  // that do not yet exist
  if (onchainStaticResolverImplementsDefaultAddress(chainId, resolverAddress)) {
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
            address: defaultRecord.address,
            coinType: _coinType,
          });
        }
      }
    }
  }

  return resolverRecords;
}
