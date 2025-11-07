import type * as schema from "@ensnode/ensnode-schema";

import { builder } from "@/graphql-api/builder";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { DomainRef } from "@/graphql-api/schema/domain";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
import { db } from "@/lib/db";

type RequiredAndNotNull<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

type _Registry = typeof schema.registry.$inferSelect;

type Registry = Pick<_Registry, "type" | "id">;

export type RegistryContract = Registry & RequiredAndNotNull<_Registry, "chainId" | "address">;
export type ImplicitRegistry = Registry & RequiredAndNotNull<_Registry, "parentDomainNode">;

export const RegistryInterface = builder.interfaceRef<Registry>("Registry");
RegistryInterface.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // Registry.domain
    //////////////////////
    domain: t.field({
      type: DomainRef,
      description: "TODO",
      nullable: true,
      resolve: (parent) => null,
    }),

    //////////////////////
    // Registry.domains
    //////////////////////
    domains: t.field({
      type: [DomainRef],
      description: "TODO",
      resolve: ({ id }) =>
        db.query.domain.findMany({
          where: (t, { eq }) => eq(t.registryId, id),
        }),
    }),
  }),
});

export const RegistryContractRef = builder.objectRef<RegistryContract>("RegistryContract");
RegistryContractRef.implement({
  description: "A Registry Contract",
  interfaces: [RegistryInterface],
  isTypeOf: (value) => (value as _Registry).type === "RegistryContract",
  fields: (t) => ({
    ////////////////////////////////
    // RegistryContract.permissions
    ////////////////////////////////
    permissions: t.field({
      type: PermissionsRef,
      description: "TODO",
      resolve: ({ chainId, address }) => null,
    }),

    /////////////////////////////
    // RegistryContract.contract
    /////////////////////////////
    contract: t.field({
      type: AccountIdRef,
      description: "TODO",
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),
  }),
});

export const ImplicitRegistryRef = builder.objectRef<ImplicitRegistry>("ImplicitRegistry");
ImplicitRegistryRef.implement({
  description: "An Implicit Registry",
  interfaces: [RegistryInterface],
  isTypeOf: (value) => (value as _Registry).type === "ImplicitRegistry",
  fields: (t) => ({}),
});

export const ImplicitRegistryIdInput = builder.inputType("ImplicitRegistryIdInput", {
  description: "TODO",
  fields: (t) => ({
    parent: t.field({
      type: "Node",
      description: "TODO",
      required: true,
    }),
  }),
});

export const RegistryIdInput = builder.inputType("RegistryIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    contract: t.field({ type: AccountIdInput, required: false }),
    implicit: t.field({ type: ImplicitRegistryIdInput, required: false }),
  }),
});
