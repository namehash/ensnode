import { hexToBigInt } from "viem";

import type { ENSv1DomainId } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import type { BaseRegistrarRegistration } from "@/graphql-api/schema/registration";

export const WrappedBaseRegistrarRegistrationRef = builder.objectRef<
  Pick<BaseRegistrarRegistration, "domainId" | "wrappedExpiration" | "wrappedFuses">
>("WrappedBaseRegistrarRegistration");

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
      resolve: (parent) => hexToBigInt(parent.domainId as ENSv1DomainId),
    }),
  }),
});
