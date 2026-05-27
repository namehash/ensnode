import type { Address, CoinType, InterpretedName } from "enssdk";

import {
  getENSIP19SupportedCoinTypes,
  type MultichainPrimaryNameByCoinTypeResolutionResult,
  resolvePrimaryNamesByCoinTypes,
} from "@/lib/resolution/multichain-primary-name-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import { coinTypeToEnsip19Chain } from "@/omnigraph-api/lib/resolution/chain-coin-type";
import type { PrimaryNameRecordModel } from "@/omnigraph-api/schema/resolution";

type PrimaryNameResolutionOptions = {
  disableAcceleration: boolean;
  canAccelerate: boolean;
};

const toResolutionOptions = (options: PrimaryNameResolutionOptions) => ({
  accelerate: !options.disableAcceleration,
  canAccelerate: options.canAccelerate,
});

const toPrimaryNameRecord = (
  address: Address,
  coinType: CoinType,
  name: InterpretedName | null,
  options: PrimaryNameResolutionOptions,
): PrimaryNameRecordModel => ({
  address,
  coinType,
  chain: coinTypeToEnsip19Chain(coinType),
  name,
  disableAcceleration: options.disableAcceleration,
  canAccelerate: options.canAccelerate,
});

/** Resolves primary names for the provided coin types, preserving input order. */
export async function resolvePrimaryNameRecords(
  address: Address,
  coinTypes: CoinType[],
  options: PrimaryNameResolutionOptions,
): Promise<PrimaryNameRecordModel[]> {
  const supportedCoinTypes = new Set(getENSIP19SupportedCoinTypes());
  const resolvableCoinTypes = coinTypes.filter((coinType) => supportedCoinTypes.has(coinType));
  const nonResolvableCoinTypes = coinTypes.filter((coinType) => !supportedCoinTypes.has(coinType));

  let resolvedByCoinType: MultichainPrimaryNameByCoinTypeResolutionResult = {};
  if (resolvableCoinTypes.length > 0) {
    const { result } = await runWithTrace(() =>
      resolvePrimaryNamesByCoinTypes(address, resolvableCoinTypes, toResolutionOptions(options)),
    );
    resolvedByCoinType = result;
  }

  const recordsByCoinType = new Map<CoinType, PrimaryNameRecordModel>();

  for (const coinType of resolvableCoinTypes) {
    recordsByCoinType.set(
      coinType,
      toPrimaryNameRecord(
        address,
        coinType,
        (resolvedByCoinType[coinType] ?? null) as InterpretedName | null,
        options,
      ),
    );
  }

  for (const coinType of nonResolvableCoinTypes) {
    recordsByCoinType.set(coinType, toPrimaryNameRecord(address, coinType, null, options));
  }

  return coinTypes.map((coinType) => {
    const record = recordsByCoinType.get(coinType);
    if (!record) {
      throw new Error(`Missing primary name record for coinType ${coinType}.`);
    }
    return record;
  });
}

/** Resolves primary names for all ENSIP-19 supported coin types in the current namespace. */
export async function resolveDefaultPrimaryNameRecords(
  address: Address,
  options: PrimaryNameResolutionOptions,
): Promise<PrimaryNameRecordModel[]> {
  const coinTypes = getENSIP19SupportedCoinTypes();
  const { result } = await runWithTrace(() =>
    resolvePrimaryNamesByCoinTypes(address, coinTypes, toResolutionOptions(options)),
  );

  return coinTypes.map((coinType) =>
    toPrimaryNameRecord(
      address,
      coinType,
      (result[coinType] ?? null) as InterpretedName | null,
      options,
    ),
  );
}
