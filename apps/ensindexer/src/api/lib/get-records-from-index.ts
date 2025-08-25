import { db } from "ponder:api";
import { onchainStaticResolverImplementsDefaultAddress } from "@/api/lib/acceleration/known-onchain-static-resolver";
import type { IndexedResolverRecords } from "@/api/lib/make-records-response";
import { withSpanAsync } from "@/lib/auto-span";
import { makeResolverId } from "@/lib/ids";
import { ChainId } from "@ensnode/datasources";
import {
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
  // fetch the Resolver and its records from index
  const resolverId = makeResolverId(chainId, resolverAddress, node);

  const resolver = await withSpanAsync(tracer, "resolver.findFirst", {}, async () => {
    const record = await db.query.resolver.findFirst({
      where: (resolver, { eq }) => eq(resolver.id, resolverId),
      columns: { name: true },
      with: { addressRecords: true, textRecords: true },
    });

    // NOTE: fix the inferred drizzle types: always results in IndexedResolverRecords | undefined
    return record as IndexedResolverRecords | undefined;
  });

  if (!resolver) return null;

  // if the resolver implements address record defaulting, materialize all selected address records
  // that do not yet exist
  if (onchainStaticResolverImplementsDefaultAddress(chainId, resolverAddress)) {
    if (selection.addresses) {
      const defaultRecord = resolver.addressRecords.find(
        (record) => record.coinType === DEFAULT_EVM_COIN_TYPE_BIGINT,
      );

      for (const coinType of selection.addresses) {
        const _coinType = BigInt(coinType);
        const existing = resolver.addressRecords.find((record) => record.coinType === _coinType);
        if (!existing && defaultRecord) {
          resolver.addressRecords.push({ address: defaultRecord.address, coinType: _coinType });
        }
      }
    }
  }

  return resolver;
}
