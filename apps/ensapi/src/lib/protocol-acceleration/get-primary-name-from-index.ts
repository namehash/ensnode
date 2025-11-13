import { trace } from "@opentelemetry/api";
import type { Address } from "viem";

import {
  type CoinType,
  coinTypeReverseLabel,
  DEFAULT_EVM_COIN_TYPE,
  type Name,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import { withSpanAsync } from "@/lib/tracing/auto-span";

const tracer = trace.getTracer("get-primary-name");

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getENSIP19ReverseNameRecordFromIndex(
  address: Address,
  coinType: CoinType,
): Promise<Name | null> {
  const _coinType = BigInt(coinType);

  // retrieve from index
  const records = await withSpanAsync(
    tracer,
    "reverseNameRecord.findMany",
    { address, coinType: coinTypeReverseLabel(coinType) },
    () =>
      db.query.reverseNameRecord.findMany({
        where: (t, { and, inArray, eq }) =>
          and(
            // address = address
            eq(t.address, address),
            // AND coinType IN [coinType, DEFAULT_EVM_COIN_TYPE]
            inArray(t.coinType, [_coinType, DEFAULT_EVM_COIN_TYPE_BIGINT]),
          ),
        columns: { coinType: true, value: true },
      }),
  );

  const coinTypeName = records.find((pn) => pn.coinType === _coinType)?.value ?? null;
  const defaultName =
    records.find((pn) => pn.coinType === DEFAULT_EVM_COIN_TYPE_BIGINT)?.value ?? null;

  return coinTypeName ?? defaultName;
}
