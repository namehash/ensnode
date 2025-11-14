import type { RegistryId, RequiredAndNotNull } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { AccountIdInput, AccountIdRef } from "@/graphql-api/schema/account-id";
import { type Domain, DomainRef } from "@/graphql-api/schema/domain";
import { PermissionsRef } from "@/graphql-api/schema/permissions";
import { db } from "@/lib/db";

export const RegistryInterfaceRef = builder.loadableInterfaceRef("Registry", {
  load: (ids: RegistryId[]) =>
    db.query.registry.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Registry = Exclude<typeof RegistryInterfaceRef.$inferType, RegistryId>;
export type RegistryInterface = Pick<Registry, "type" | "id">;
export type RegistryContract = RequiredAndNotNull<Registry, "chainId" | "address">;
export type ImplicitRegistry = Registry;

RegistryInterfaceRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // Registry.id
    //////////////////////
    id: t.expose("id", {
      description: "TODO",
      type: "ID",
      nullable: false,
    }),

    ////////////////////
    // Registry.parents
    ////////////////////
    parents: t.loadableGroup({
      description: "TODO",
      type: DomainRef,
      load: (ids: RegistryId[]) =>
        db.query.domain.findMany({
          where: (t, { inArray }) => inArray(t.subregistryId, ids),
          with: { label: true },
        }),
      // biome-ignore lint/style/noNonNullAssertion: subregistryId guaranteed to exist via inArray
      group: (domain) => (domain as Domain).subregistryId!,
      resolve: getModelId,
    }),

    //////////////////////
    // Registry.domains
    //////////////////////
    domains: t.loadableGroup({
      description: "TODO",
      type: DomainRef,
      load: (ids: RegistryId[]) =>
        db.query.domain.findMany({
          where: (t, { inArray }) => inArray(t.registryId, ids),
          with: { label: true },
        }),
      group: (domain) => (domain as Domain).registryId,
      resolve: getModelId,
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
      description: "TODO",
      type: PermissionsRef,
      // TODO: render a RegistryPermissions model that parses the backing permissions into registry-semantic roles
      resolve: ({ chainId, address }) => null,
    }),

    /////////////////////////////
    // RegistryContract.contract
    /////////////////////////////
    contract: t.field({
      description: "TODO",
      type: AccountIdRef,
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
    parent: t.field({ type: "ImplicitRegistryId", required: true }),
  }),
});

export const RegistryIdInput = builder.inputType("RegistryIdInput", {
  description: "TODO",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "RegistryId" }),
    contract: t.field({ type: AccountIdInput }),
    implicit: t.field({ type: ImplicitRegistryIdInput }),
  }),
});
