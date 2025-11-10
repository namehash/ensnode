import { builder } from "@/graphql-api/builder";
import type {
  ImplicitRegistry,
  Registry,
  RegistryContract,
  RegistryInterface,
} from "@/graphql-api/lib/db-types";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { DomainRef } from "@/graphql-api/schema/domain";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
import { db } from "@/lib/db";

export const RegistryInterfaceRef = builder.interfaceRef<Registry>("Registry");
RegistryInterfaceRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // Registry.id
    //////////////////////
    id: t.field({
      type: "ID",
      description: "TODO",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    //////////////////////
    // Registry.domain
    //////////////////////
    domain: t.field({
      type: [DomainRef],
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
  interfaces: [RegistryInterfaceRef],
  isTypeOf: (value) => (value as RegistryInterface).type === "RegistryContract",
  fields: (t) => ({
    ////////////////////////////////
    // RegistryContract.permissions
    ////////////////////////////////
    permissions: t.field({
      type: PermissionsRef,
      description: "TODO",
      // TODO: render a RegistryPermissions model that parses the backing permissions into registry-semantic roles
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
  interfaces: [RegistryInterfaceRef],
  isTypeOf: (value) => (value as RegistryInterface).type === "ImplicitRegistry",
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
