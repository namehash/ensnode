import { AssetId as CaipAssetId } from "caip";
import { zeroAddress } from "viem";
import z from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeAccountIdSchema, makeNodeSchema } from "../shared/zod-schemas";
import { type AssetId, AssetNamespaces, type DomainAssetId, NFTMintStatuses } from "./assets";
import {
  type NameToken,
  type NameTokenOwnershipBurned,
  type NameTokenOwnershipFullyOnchain,
  type NameTokenOwnershipNameWrapper,
  NameTokenOwnershipTypes,
  type NameTokenOwnershipUnknown,
} from "./name-token";

/**
 * Make schema for {@link AssetId}.
 */
export const makeAssetIdSchema = (valueLabel: string = "Asset ID Schema") =>
  z.object({
    assetNamespace: z.enum(AssetNamespaces),
    contract: makeAccountIdSchema(valueLabel),
    tokenId: z.preprocess((v) => (typeof v === "string" ? BigInt(v) : v), z.bigint().positive()),
  });

/**
 * Make schema for {@link AssetIdString}.
 */
export const makeAssetIdStringSchema = (valueLabel: string = "Asset ID String Schema") =>
  z.preprocess((v) => {
    if (typeof v === "string") {
      const result = new CaipAssetId(v);
      return {
        assetNamespace: result.assetName.namespace as "erc721" | "erc1155",
        contract: {
          chainId: Number(result.chainId.reference),
          address: result.assetName.reference,
        },
        tokenId: BigInt(result.tokenId),
      };
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
export const makeNameTokenSchema = (valueLabel: string = "Name Token Schema") =>
  z.object({
    token: makeAssetIdSchema(`${valueLabel}.token`),

    ownership: makeNameTokenOwnershipSchema(`${valueLabel}.ownership`),

    mintStatus: z.enum(NFTMintStatuses),
  });
