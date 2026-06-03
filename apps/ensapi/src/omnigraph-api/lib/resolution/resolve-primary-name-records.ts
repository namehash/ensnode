import type { Address, CoinType, InterpretedName } from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import { resolvePrimaryNamesByCoinTypes } from "@/lib/resolution/multichain-primary-name-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import {
  CHAIN_NAME_COIN_TYPES,
  coinTypeToChainName,
} from "@/omnigraph-api/lib/resolution/chain-coin-type";
import type { PrimaryNameRecordModel } from "@/omnigraph-api/schema/primary-name-record";

type PrimaryNameResolutionOptions = {
  accelerate: boolean;
  canAccelerate: boolean;
};

export type PrimaryNameRecordsResolution = {
  trace: TracingTrace;
  records: PrimaryNameRecordModel[];
};

const toPrimaryNameRecord = (
  address: Address,
  coinType: CoinType,
  name: InterpretedName | null,
): PrimaryNameRecordModel => ({
  address,
  coinType,
  chainName: coinTypeToChainName(coinType),
  name,
});

/** Resolves primary names for the provided coin types, preserving input order. */
export async function resolvePrimaryNameRecords(
  address: Address,
  coinTypes: CoinType[],
  options: PrimaryNameResolutionOptions,
): Promise<PrimaryNameRecordsResolution> {
  const supportedCoinTypes = new Set(CHAIN_NAME_COIN_TYPES);
  const resolvableCoinTypes = coinTypes.filter((coinType) => supportedCoinTypes.has(coinType));

  if (resolvableCoinTypes.length === 0) {
    return {
      trace: [],
      records: coinTypes.map((coinType) => toPrimaryNameRecord(address, coinType, null)),
    };
  }

  const { trace, result: resolvedByCoinType } = await runWithTrace(() =>
    resolvePrimaryNamesByCoinTypes(address, resolvableCoinTypes, options),
  );

  const records = coinTypes.map((coinType) => {
    const name = (resolvedByCoinType[coinType] ?? null) as InterpretedName | null;
    return toPrimaryNameRecord(address, coinType, name);
  });

  return { trace, records };
}
