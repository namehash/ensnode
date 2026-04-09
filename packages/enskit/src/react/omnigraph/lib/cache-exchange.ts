import {
  type Cache,
  cacheExchange,
  type ResolveInfo,
  type Variables,
} from "@urql/exchange-graphcache";
import type { AccountId, Address, PermissionsId, RegistryId, ResolverId } from "enssdk";
import { makePermissionsId, makeRegistryId, makeResolverId, stringifyAccountId } from "enssdk";
import { introspection } from "enssdk/omnigraph";

import { localConnectionResolvers } from "./local-connection-resolvers";

/**
 * Entities without keys are 'Embedded Data', and we tell graphcache about them to avoid warnings
 * about the inability to normalize them.
 *
 * @see https://nearform.com/open-source/urql/docs/graphcache/normalized-caching/#custom-keys-and-non-keyable-entities
 */
const EMBEDDED_DATA = () => null;

/**
 * This local resolver delegates to graphcache's built-in cache resolution with the full argument set,
 * effectively telling urql 'not found locally' and to fetch from the network.
 */
const passthrough = (args: Variables, cache: Cache, info: ResolveInfo) =>
  cache.resolve(info.parentTypeName, info.fieldName, args);

// produce relayPagination() local resolvers for each t.connection in the schema
const connectionResolvers = localConnectionResolvers(introspection);

// TODO: add bigint parsing to the relevant scalar fields ala localConnectionResolvers
// @see https://nearform.com/open-source/urql/docs/graphcache/local-resolvers/#transforming-records

export const omnigraphCacheExchange = cacheExchange({
  schema: introspection,
  keys: {
    // by default, all Entities are assumed to match the Relay spec, and graphcache treats
    // them as keyable by `id`. if it encounters an Entity with no `id` field and no other
    // special handling here in the cacheExchange.keys definitions, it will issue a warning.

    // AccountIds are keyable by stringifying them
    AccountId: (data) => stringifyAccountId(data as unknown as AccountId),

    // These entities are Embedded Data and don't have a relevant key
    Label: EMBEDDED_DATA,
    WrappedBaseRegistrarRegistration: EMBEDDED_DATA,
  },
  resolvers: {
    // TODO: maybe there's a better way to import/cast the type of args in these local resolvers?

    // derive relayPagination() resolvers for all connection fields in the schema
    ...connectionResolvers,

    Query: {
      ...connectionResolvers.Query,

      domain(parent, args, cache, info) {
        const by = args.by as { id?: string; name?: string };

        if (by.id) {
          const v1Key = cache.keyOfEntity({ __typename: "ENSv1Domain", id: by.id });
          if (v1Key && cache.resolve(v1Key, "id")) return v1Key;

          const v2Key = cache.keyOfEntity({ __typename: "ENSv2Domain", id: by.id });
          if (v2Key && cache.resolve(v2Key, "id")) return v2Key;
        }

        return passthrough(args, cache, info);
      },
      account(parent, args, cache, info) {
        const by = args.by as { id?: Address; address?: Address };

        if (by.id) return { __typename: "Account", id: by.id };
        if (by.address) return { __typename: "Account", id: by.address };

        throw new Error("never");
      },
      registry(parent, args, cache, info) {
        const by = args.by as { id?: RegistryId; contract?: AccountId };

        if (by.id) return { __typename: "Registry", id: by.id };
        if (by.contract) return { __typename: "Registry", id: makeRegistryId(by.contract) };

        throw new Error("never");
      },
      resolver(parent, args, cache, info) {
        const by = args.by as { id?: ResolverId; contract?: AccountId };

        if (by.id) return { __typename: "Resolver", id: by.id };
        if (by.contract) return { __typename: "Resolver", id: makeResolverId(by.contract) };

        throw new Error("never");
      },
      permissions(parent, args, cache, info) {
        const by = args.by as { id?: PermissionsId; contract?: AccountId };

        if (by.id) return { __typename: "Permissions", id: by.id };
        if (by.contract) return { __typename: "Permissions", id: makePermissionsId(by.contract) };

        throw new Error("never");
      },
    },
  },
});
