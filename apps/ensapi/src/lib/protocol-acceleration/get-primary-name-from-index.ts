import { trace } from "@opentelemetry/api";
import {
  type CoinType,
  coinTypeReverseLabel,
  DEFAULT_EVM_COIN_TYPE,
  type InterpretedName,
  type NormalizedAddress,
} from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";
import { withSpanAsync } from "@/lib/instrumentation/auto-span";

const tracer = trace.getTracer("get-primary-name");

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getENSIP19ReverseNameRecordFromIndex(
  address: NormalizedAddress,
  coinType: CoinType,
): Promise<InterpretedName | null> {
  const _coinType = BigInt(coinType);

  // retrieve from index
  const records = await withSpanAsync(
    tracer,
    "reverseNameRecord.findMany",
    { address, coinType: coinTypeReverseLabel(coinType) },
    () =>
      ensDb.query.reverseNameRecord.findMany({
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
