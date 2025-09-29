import { db } from "ponder:api";
import { withSpanAsync } from "@/lib/auto-span";
import { CoinType, DEFAULT_EVM_COIN_TYPE, Name, coinTypeReverseLabel } from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import { Address } from "viem";

const tracer = trace.getTracer("get-primary-name");

const DEFAULT_EVM_COIN_TYPE_BIGINT = BigInt(DEFAULT_EVM_COIN_TYPE);

export async function getPrimaryNameFromIndex(
  address: Address,
  coinType: CoinType,
): Promise<Name | null> {
  const _coinType = BigInt(coinType);

  // retrieve from index
  const records = await withSpanAsync(
    tracer,
    "ext_primaryName.findMany",
    { address, coinType: coinTypeReverseLabel(coinType) },
    () =>
      db.query.ext_primaryName.findMany({
        where: (t, { and, inArray, eq }) =>
          and(
            // address = address
            eq(t.address, address),
            // AND coinType IN [_coinType, DEFAULT_EVM_COIN_TYPE]
            inArray(t.coinType, [_coinType, DEFAULT_EVM_COIN_TYPE_BIGINT]),
          ),
        columns: { coinType: true, name: true },
      }),
  );

  const coinTypeName = records.find((pn) => pn.coinType === _coinType)?.name ?? null;

  const defaultName =
    records.find((pn) => pn.coinType === DEFAULT_EVM_COIN_TYPE_BIGINT)?.name ?? null;

  return coinTypeName ?? defaultName;
}
