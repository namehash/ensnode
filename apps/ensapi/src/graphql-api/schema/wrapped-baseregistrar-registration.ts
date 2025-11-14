import { hexToBigInt } from "viem";

import type { ENSv1DomainId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import type { BaseRegistrarRegistration } from "@/graphql-api/schema/registration";

export const WrappedBaseRegistrarRegistrationRef = builder.objectRef<BaseRegistrarRegistration>(
  "WrappedBaseRegistrarRegistration",
);

WrappedBaseRegistrarRegistrationRef.implement({
  description: "TODO",
  fields: (t) => ({
    ///////////////////
    // Wrapped.tokenId
    ///////////////////
    tokenId: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      // NOTE: only ENSv1 Domains can be wrapped, id is guaranteed to be ENSv1DomainId === Node
      resolve: (parent) => hexToBigInt(parent.domainId as ENSv1DomainId),
    }),

    /////////////////
    // Wrapped.fuses
    /////////////////
    fuses: t.field({
      description: "TODO",
      type: "Int",
      nullable: false,
      // TODO: decode/render Fuses enum
      resolve: (parent) => parent.wrappedFuses,
    }),
  }),
});
