import { inArray } from "drizzle-orm";
import type { ChainId, NormalizedAddress } from "enssdk";

import di from "@/di";
import { builder } from "@/omnigraph-api/builder";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";

export const EfpAccountMetadataRef = builder.loadableObjectRef("EfpAccountMetadata", {
  load: (ids: string[]) => {
    const { ensDb, ensIndexerSchema } = di.context;
    return ensDb
      .select()
      .from(ensIndexerSchema.efpAccountMetadata)
      .where(inArray(ensIndexerSchema.efpAccountMetadata.id, ids));
  },
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type EfpAccountMetadata = Exclude<typeof EfpAccountMetadataRef.$inferType, string>;

/**
 * The synthetic primary key used by `efp_account_metadata`. Mirrors the EFP plugin's
 * `accountMetadataId` (`${address}-${key}`, with a lowercased address).
 */
export const efpAccountMetadataId = (address: NormalizedAddress, key: string): string =>
  `${address}-${key}`;

//////////////////////
// EfpAccountMetadata
//////////////////////
EfpAccountMetadataRef.implement({
  description: 'An EFP `(address, key) -> value` account-metadata entry (e.g. "primary-list").',
  fields: (t) => ({
    id: t.field({ type: "String", nullable: false, resolve: (metadata) => metadata.id }),

    chainId: t.field({
      description: "Chain id of the AccountMetadata contract.",
      type: "ChainId",
      nullable: false,
      resolve: (metadata) => metadata.chainId as ChainId,
    }),

    contractAddress: t.field({
      description: "Address of the AccountMetadata contract.",
      type: "Address",
      nullable: false,
      resolve: (metadata) => metadata.contractAddress as NormalizedAddress,
    }),

    address: t.field({
      description: "The account this metadata belongs to.",
      type: "Address",
      nullable: false,
      resolve: (metadata) => metadata.address as NormalizedAddress,
    }),

    key: t.field({
      description: "The metadata key (UTF-8 string).",
      type: "String",
      nullable: false,
      resolve: (metadata) => metadata.key,
    }),

    value: t.field({
      description: "The metadata value (raw bytes).",
      type: "Hex",
      nullable: false,
      resolve: (metadata) => metadata.value,
    }),

    createdAt: t.field({ type: "BigInt", nullable: false, resolve: (m) => m.createdAt }),
    updatedAt: t.field({ type: "BigInt", nullable: false, resolve: (m) => m.updatedAt }),
  }),
});
