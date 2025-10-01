import { db } from "ponder:api";
import { withSpanAsync } from "@/lib/auto-span";
import { CoinType, DEFAULT_EVM_COIN_TYPE, Name, coinTypeReverseLabel } from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import { Address } from "viem";

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
    "ext_reverseNameRecord.findMany",
    { address, coinType: coinTypeReverseLabel(coinType) },
    () =>
      db.query.ext_reverseNameRecord.findMany({
        where: (t, { and, inArray, eq }) =>
          and(
            // address = address
            eq(t.address, address),
            // AND coinType IN [_coinType, DEFAULT_EVM_COIN_TYPE]
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
