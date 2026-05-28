import type { Address, CoinType, InterpretedName } from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import {
  type MultichainPrimaryNameByCoinTypeResolutionResult,
  resolvePrimaryNamesByCoinTypes,
} from "@/lib/resolution/multichain-primary-name-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import {
  coinTypeToEnsip19Chain,
  ENSIP19_COIN_TYPES,
} from "@/omnigraph-api/lib/resolution/chain-coin-type";
import type { PrimaryNameRecordModel } from "@/omnigraph-api/schema/resolution";

type PrimaryNameResolutionOptions = {
  accelerate: boolean;
  canAccelerate: boolean;
};

export type PrimaryNameRecordsResolution = {
  trace: TracingTrace | null;
  records: PrimaryNameRecordModel[];
};

const toPrimaryNameRecord = (
  address: Address,
  coinType: CoinType,
  name: InterpretedName | null,
): PrimaryNameRecordModel => ({
  address,
  coinType,
  chain: coinTypeToEnsip19Chain(coinType),
  name,
});

/** Resolves primary names for the provided coin types, preserving input order. */
export async function resolvePrimaryNameRecords(
  address: Address,
  coinTypes: CoinType[],
  options: PrimaryNameResolutionOptions,
): Promise<PrimaryNameRecordsResolution> {
  const supportedCoinTypes = new Set(ENSIP19_COIN_TYPES);
  const resolvableCoinTypes = coinTypes.filter((coinType) => supportedCoinTypes.has(coinType));

  const { trace, result: resolvedByCoinType } =
    resolvableCoinTypes.length > 0
      ? await runWithTrace(() =>
          resolvePrimaryNamesByCoinTypes(address, resolvableCoinTypes, options),
        )
      : { trace: null, result: {} as MultichainPrimaryNameByCoinTypeResolutionResult };

  const records = coinTypes.map((coinType) => {
    const name = (resolvedByCoinType[coinType] ?? null) as InterpretedName | null;
    return toPrimaryNameRecord(address, coinType, name);
  });

  return { trace, records };
}
