import { AssetId as CaipAssetId } from "caip";
import z from "zod/v4";

import { makeAccountIdSchema, makeLowercaseAddressSchema, makeNodeSchema } from "../internal";
import {
  type AssetId,
  AssetNamespaces,
  type DomainAssetId,
  NFTMintStatuses,
  type SerializedAssetId,
} from "./assets";
import type { NameToken } from "./name-token";

/**
 * Make schema for {@link AssetId}.
 */
export const makeAssetIdSchema = (valueLabel: string = "Asset ID Schema") =>
  z.object({
    assetNamespace: z.enum(AssetNamespaces),
    contract: makeAccountIdSchema(valueLabel),
    tokenId: z.bigint().positive(),
  });

/**
 * Make schema for {@link SerializedAssetId}.
 */
export const makeSerializedAssetIdSchema = (valueLabel: string = "Serialized Asset ID Schema") =>
  z.coerce
    .string()
    .transform((v) => {
      const result = new CaipAssetId(v);
      return {
        assetNamespace: result.assetName.namespace,
        contract: {
          chainId: Number(result.chainId.reference),
          address: result.assetName.reference,
        },
        tokenId: BigInt(result.tokenId),
      };
    })
    .pipe(makeAssetIdSchema(valueLabel));

/**
 * Make schema for {@link DomainAssetId}.
 */
export const makeDomainAssetSchema = (valueLabel: string = "Domain Asset Schema") =>
  z.union([
    z
      .object({
        assetId: z.unknown().pipe(makeSerializedAssetIdSchema(valueLabel)),
        domainId: makeNodeSchema(`${valueLabel}.domainId`),
      })
      .transform(({ assetId, domainId }) => ({ ...assetId, domainId })),

    makeAssetIdSchema(valueLabel).extend({
      domainId: makeNodeSchema(`${valueLabel}.domainId`),
    }),
  ]);

/**
 * Make schema for {@link NameToken}.
 */
export const makeNameTokenSchema = (valueLabel: string = "Name Token Schema") =>
  z.object({
    domainAsset: makeDomainAssetSchema(`${valueLabel}.domainAsset`),

    owner: makeLowercaseAddressSchema(`${valueLabel}.owner`),

    mintStatus: z.enum(NFTMintStatuses),
  });
