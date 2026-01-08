import { AssetId as CaipAssetId } from "caip";
import { zeroAddress } from "viem";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { type AssetId, AssetNamespaces } from "../shared/types";
import { makeAccountIdSchema, makeNodeSchema } from "../shared/zod-schemas";
import { type DomainAssetId, NFTMintStatuses, type SerializedAssetId } from "./assets";
import {
  type NameToken,
  type NameTokenOwnershipBurned,
  type NameTokenOwnershipFullyOnchain,
  type NameTokenOwnershipNameWrapper,
  NameTokenOwnershipTypes,
  type NameTokenOwnershipUnknown,
} from "./name-token";

const tokenIdSchemaSerializable = z.string();
const tokenIdSchemaNative = z.preprocess(
  (v) => (typeof v === "string" ? BigInt(v) : v),
  z.bigint().positive(),
);

export function makeTokenIdSchema<const SerializableType extends boolean>(
  _valueLabel: string,
  serializable: SerializableType,
): SerializableType extends true ? typeof tokenIdSchemaSerializable : typeof tokenIdSchemaNative;
export function makeTokenIdSchema(
  _valueLabel: string = "Token ID Schema",
  serializable: true | false = false,
): typeof tokenIdSchemaSerializable | typeof tokenIdSchemaNative {
  if (serializable) {
    return tokenIdSchemaSerializable;
  } else {
    return tokenIdSchemaNative;
  }
}

/**
 * Make schema for {@link AssetId}.
 *
 */
export const makeAssetIdSchema = <const SerializableType extends boolean = false>(
  valueLabel: string = "Asset ID Schema",
  serializable?: SerializableType,
) => {
  return z.object({
    assetNamespace: z.enum(AssetNamespaces),
    contract: makeAccountIdSchema(valueLabel),
    tokenId: makeTokenIdSchema(valueLabel, serializable ?? false),
  });
};

/**
 * Make schema for {@link AssetIdString}.
 */
export const makeAssetIdStringSchema = (valueLabel: string = "Asset ID String Schema") =>
  z.preprocess((v) => {
    if (typeof v === "string") {
      const result = new CaipAssetId(v);
      return {
        assetNamespace: result.assetName.namespace,
        contract: {
          chainId: Number(result.chainId.reference),
          address: result.assetName.reference,
        },
        tokenId: result.tokenId,
      } as SerializedAssetId;
    }

    return v;
  }, makeAssetIdSchema(valueLabel));

/**
 * Make schema for {@link DomainAssetId}.
 */
export const makeDomainAssetSchema = (valueLabel: string = "Domain Asset Schema") =>
  makeAssetIdSchema(valueLabel).extend({
    domainId: makeNodeSchema(`${valueLabel}.domainId`),
  });

function invariant_nameTokenOwnershipHasNonZeroAddressOwner(
  ctx: ParsePayload<
    NameTokenOwnershipNameWrapper | NameTokenOwnershipFullyOnchain | NameTokenOwnershipUnknown
  >,
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

export const makeNameTokenOwnershipNameWrapperSchema = (
  valueLabel: string = "Name Token Ownership NameWrapper",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.NameWrapper),
      owner: makeAccountIdSchema(`${valueLabel}.owner`),
    })
    .check(invariant_nameTokenOwnershipHasNonZeroAddressOwner);

export const makeNameTokenOwnershipFullyOnchainSchema = (
  valueLabel: string = "Name Token Ownership Fully Onchain",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.FullyOnchain),
      owner: makeAccountIdSchema(`${valueLabel}.owner`),
    })
    .check(invariant_nameTokenOwnershipHasNonZeroAddressOwner);

export const makeNameTokenOwnershipBurnedSchema = (
  valueLabel: string = "Name Token Ownership Burned",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.Burned),
      owner: makeAccountIdSchema(`${valueLabel}.owner`),
    })
    .check(invariant_nameTokenOwnershipHasZeroAddressOwner);

export const makeNameTokenOwnershipUnknownSchema = (
  valueLabel: string = "Name Token Ownership Unknown",
) =>
  z
    .object({
      ownershipType: z.literal(NameTokenOwnershipTypes.Unknown),
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

export const makeNameTokenOwnershipSchema = (valueLabel: string = "Name Token Ownership") =>
  z.discriminatedUnion("ownershipType", [
    makeNameTokenOwnershipNameWrapperSchema(valueLabel),
    makeNameTokenOwnershipFullyOnchainSchema(valueLabel),
    makeNameTokenOwnershipBurnedSchema(valueLabel),
    makeNameTokenOwnershipUnknownSchema(valueLabel),
  ]);

/**
 * Make schema for {@link NameToken}.
 */
export const makeNameTokenSchema = <const SerializableType extends boolean>(
  valueLabel: string = "Name Token Schema",
  serializable?: SerializableType,
) =>
  z.object({
    token: makeAssetIdSchema(`${valueLabel}.token`, serializable),

    ownership: makeNameTokenOwnershipSchema(`${valueLabel}.ownership`),

    mintStatus: z.enum(NFTMintStatuses),
  });
