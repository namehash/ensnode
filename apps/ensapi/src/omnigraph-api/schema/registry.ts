import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import { makePermissionsId, type RegistryId } from "enssdk";

import type { RequiredAndNotNull, RequiredAndNull } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateBy } from "@/omnigraph-api/lib/connection-helpers";
import { resolveFindDomains } from "@/omnigraph-api/lib/find-domains/find-domains-resolver";
import {
  domainsBase,
  filterByName,
  filterByRegistry,
  withOrderingMetadata,
} from "@/omnigraph-api/lib/find-domains/layers";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountIdInput, AccountIdRef } from "@/omnigraph-api/schema/account-id";
import { ID_PAGINATED_CONNECTION_ARGS } from "@/omnigraph-api/schema/constants";
import {
  DomainInterfaceRef,
  DomainsOrderInput,
  RegistryDomainsWhereInput,
} from "@/omnigraph-api/schema/domain";
import { PermissionsRef } from "@/omnigraph-api/schema/permissions";

///////////////////////////////////
// Loadable Interface (Registry)
///////////////////////////////////

export const RegistryInterfaceRef = builder.loadableInterfaceRef("Registry", {
  load: (ids: RegistryId[]) =>
    ensDb.query.registry.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Registry = Exclude<typeof RegistryInterfaceRef.$inferType, RegistryId>;
export type RegistryInterface = Omit<Registry, "node">;
export type ENSv1Registry = RequiredAndNull<Registry, "node"> & { type: "ENSv1Registry" };
export type ENSv1VirtualRegistry = RequiredAndNotNull<Registry, "node"> & {
  type: "ENSv1VirtualRegistry";
};
export type ENSv2Registry = RequiredAndNull<Registry, "node"> & { type: "ENSv2Registry" };

const isENSv1Registry = (registry: unknown): registry is ENSv1Registry =>
  (registry as RegistryInterface).type === "ENSv1Registry";

const isENSv1VirtualRegistry = (registry: unknown): registry is ENSv1VirtualRegistry =>
  (registry as RegistryInterface).type === "ENSv1VirtualRegistry";

const isENSv2Registry = (registry: unknown): registry is ENSv2Registry =>
  (registry as RegistryInterface).type === "ENSv2Registry";

export const ENSv1RegistryRef = builder.objectRef<ENSv1Registry>("ENSv1Registry");
export const ENSv1VirtualRegistryRef =
  builder.objectRef<ENSv1VirtualRegistry>("ENSv1VirtualRegistry");
export const ENSv2RegistryRef = builder.objectRef<ENSv2Registry>("ENSv2Registry");

/////////////////////////////////////
// RegistryInterface Implementation
/////////////////////////////////////
RegistryInterfaceRef.implement({
  description:
    "A Registry represents a Registry contract in the ENS namegraph. It may be an ENSv1Registry (a concrete ENSv1 Registry contract), an ENSv1VirtualRegistry (the virtual Registry managed by an ENSv1 domain that has children), or an ENSv2Registry.",
  fields: (t) => ({
    /////////////////
    // Registry.id
    /////////////////
    id: t.field({
      description: "A unique reference to this Registry.",
      type: "RegistryId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////
    // Registry.contract
    ///////////////////
    contract: t.field({
      description: "Contract metadata for this Registry",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),

    ///////////////////
    // Registry.parents
    ///////////////////
    parents: t.connection({
      description: "The Domains for which this Registry is a Subregistry.",
      type: DomainInterfaceRef,
      resolve: (parent, args) => {
        const scope = eq(ensIndexerSchema.domain.subregistryId, parent.id);

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.domain, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb.query.domain.findMany({
                  where: and(scope, paginateBy(ensIndexerSchema.domain.id, before, after)),
                  orderBy: orderPaginationBy(ensIndexerSchema.domain.id, inverted),
                  limit,
                  with: { label: true },
                }),
            ),
        });
      },
    }),

    //////////////////////
    // Registry.domains
    //////////////////////
    domains: t.connection({
      description: "The Domains managed by this Registry.",
      type: DomainInterfaceRef,
      args: {
        where: t.arg({ type: RegistryDomainsWhereInput }),
        order: t.arg({ type: DomainsOrderInput }),
      },
      resolve: (parent, { where, order, ...connectionArgs }, context) => {
        const base = filterByRegistry(domainsBase(), parent.id);
        const named = filterByName(base, where?.name);
        const domains = withOrderingMetadata(named);
        return resolveFindDomains(context, { domains, order, ...connectionArgs });
      },
    }),

    ////////////////////////
    // Registry.permissions
    ////////////////////////
    permissions: t.field({
      description: "The Permissions managed by this Registry.",
      type: PermissionsRef,
      // TODO: render a RegistryPermissions model that parses the backing permissions into registry-semantic roles
      resolve: ({ chainId, address }) => makePermissionsId({ chainId, address }),
    }),
  }),
});

//////////////////////////////
// ENSv1Registry (concrete)
//////////////////////////////
ENSv1RegistryRef.implement({
  description:
    "An ENSv1Registry is a concrete ENSv1 Registry contract (the mainnet ENS Registry, the Basenames shadow Registry, or the Lineanames shadow Registry).",
  interfaces: [RegistryInterfaceRef],
  isTypeOf: (registry) => isENSv1Registry(registry),
});

//////////////////////////////
// ENSv1VirtualRegistry
//////////////////////////////
ENSv1VirtualRegistryRef.implement({
  description:
    "An ENSv1VirtualRegistry is the virtual Registry managed by an ENSv1 Domain that has children. It is keyed by `(chainId, address, node)` where `(chainId, address)` identify the concrete Registry that houses the parent Domain, and `node` is the parent Domain's namehash.",
  interfaces: [RegistryInterfaceRef],
  isTypeOf: (registry) => isENSv1VirtualRegistry(registry),
  fields: (t) => ({
    ///////////////////////////////
    // ENSv1VirtualRegistry.node
    ///////////////////////////////
    node: t.field({
      description: "The namehash of the parent ENSv1 Domain that owns this virtual Registry.",
      type: "Node",
      nullable: false,
      resolve: (parent) => parent.node,
    }),
  }),
});

//////////////////////////////
// ENSv2Registry
//////////////////////////////
ENSv2RegistryRef.implement({
  description: "An ENSv2Registry represents an ENSv2 Registry contract.",
  interfaces: [RegistryInterfaceRef],
  isTypeOf: (registry) => isENSv2Registry(registry),
});

//////////
// Inputs
//////////

export const RegistryIdInput = builder.inputType("RegistryIdInput", {
  description: "Address a Registry by ID or AccountId.",
  isOneOf: true,
  fields: (t) => ({
    id: t.field({ type: "RegistryId" }),
    contract: t.field({ type: AccountIdInput }),
  }),
});
