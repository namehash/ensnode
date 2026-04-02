import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";

import { makePermissionsId, type RegistryId } from "@ensnode/ensnode-sdk";

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
  ENSv2DomainRef,
  RegistryDomainsWhereInput,
} from "@/omnigraph-api/schema/domain";
import { PermissionsRef } from "@/omnigraph-api/schema/permissions";

export const RegistryRef = builder.loadableObjectRef("Registry", {
  load: (ids: RegistryId[]) =>
    ensDb.query.registry.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Registry = Exclude<typeof RegistryRef.$inferType, RegistryId>;

RegistryRef.implement({
  description: "A Registry represents an ENSv2 Registry contract.",
  fields: (t) => ({
    //////////////////////
    // Registry.id
    //////////////////////
    id: t.field({
      description: "A unique reference to this Registry.",
      type: "RegistryId",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ////////////////////
    // Registry.parents
    ////////////////////
    parents: t.connection({
      description: "The Domains for which this Registry is a Subregistry.",
      type: ENSv2DomainRef,
      resolve: (parent, args) => {
        const scope = eq(ensIndexerSchema.v2Domain.subregistryId, parent.id);

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.v2Domain, scope),
          connection: () =>
            resolveCursorConnection(
              { ...ID_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb.query.v2Domain.findMany({
                  where: and(scope, paginateBy(ensIndexerSchema.v2Domain.id, before, after)),
                  orderBy: orderPaginationBy(ensIndexerSchema.v2Domain.id, inverted),
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

    /////////////////////
    // Registry.contract
    /////////////////////
    contract: t.field({
      description: "Contract metadata for this Registry",
      type: AccountIdRef,
      nullable: false,
      resolve: ({ chainId, address }) => ({ chainId, address }),
    }),
  }),
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
