import { AssetId as CaipAssetId } from "caip";
import { zeroAddress } from "viem";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeAccountIdSchema, makeNodeSchema } from "../shared/zod-schemas";
import {
  type AssetId,
  AssetNamespaces,
  type DomainAssetId,
  NFTMintStatuses,
  type SerializedAssetId,
} from "./assets";
import {
  type NameToken,
  type NameTokenOwnershipBurned,
  type NameTokenOwnershipEffective,
  type NameTokenOwnershipProxy,
  NameTokenOwnershipTypes,
} from "./name-token";

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

function invariant_nameTokenOwnershipHasNonZeroAddressOwner(
  ctx: ParsePayload<NameTokenOwnershipProxy | NameTokenOwnershipEffective>,
) {
  const ownership = ctx.value;
  if (ctx.value.owner.address === zeroAddress) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Name Token Ownership with '${ownership.ownershipType}' must have 'address' other than the zero address.`,
    });
  }
}

export const makeNameTokenOwnershipProxySchema = (
  valueLabel: string = "Name Token Ownership Proxy",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.Proxy),
      owner: makeAccountIdSchema(`${valueLabel}.owner`),
    })
    .check(invariant_nameTokenOwnershipHasNonZeroAddressOwner);

export const makeNameTokenOwnershipEffectiveSchema = (
  valueLabel: string = "Name Token Ownership Effective",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.Effective),
      owner: makeAccountIdSchema(`${valueLabel}.owner`),
    })
    .check(invariant_nameTokenOwnershipHasNonZeroAddressOwner);

function invariant_nameTokenOwnershipHasZeroAddressOwner(
  ctx: ParsePayload<NameTokenOwnershipBurned>,
) {
  const ownership = ctx.value;
  if (ctx.value.owner.address !== zeroAddress) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Name Token Ownership with '${ownership.ownershipType}' must have 'address' set to the zero address.`,
    });
  }
}

export const makeNameTokenOwnershipBurnedSchema = (
  valueLabel: string = "Name Token Ownership Burned",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.Burned),
      owner: makeAccountIdSchema(`${valueLabel}.owner`),
    })
    .check(invariant_nameTokenOwnershipHasZeroAddressOwner);

export const makeNameTokenOwnershipSchema = (valueLabel: string = "Name Token Ownership") =>
  z.discriminatedUnion("ownershipType", [
    makeNameTokenOwnershipProxySchema(valueLabel),
    makeNameTokenOwnershipEffectiveSchema(valueLabel),
    makeNameTokenOwnershipBurnedSchema(valueLabel),
  ]);

/**
 * Make schema for {@link NameToken}.
 */
export const makeNameTokenSchema = (valueLabel: string = "Name Token Schema") =>
  z.object({
    domainAsset: makeDomainAssetSchema(`${valueLabel}.domainAsset`),

    ownership: makeNameTokenOwnershipSchema(`${valueLabel}.ownership`),

    mintStatus: z.enum(NFTMintStatuses),
  });
