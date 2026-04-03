import { Client, fetchExchange } from "@urql/core";
import {
  type Cache,
  cacheExchange,
  type ResolveInfo,
  type Variables,
} from "@urql/exchange-graphcache";
import type { AccountId, PermissionsId, RegistryId, ResolverId } from "enssdk";
import { makePermissionsId, makeRegistryId, makeResolverId } from "enssdk";
import { introspection } from "enssdk/omnigraph";
import type { Address } from "viem";

/**
 * Entities without keys are 'Embedded Data', and we tell graphcache about them to avoid warnings
 * about the inability to normalize them.
 *
 * @see https://nearform.com/open-source/urql/docs/graphcache/normalized-caching/#custom-keys-and-non-keyable-entities
 */
const EMBEDDED_DATA = () => null;

/**
 * Many of our resolvers allow for exact
 *
 * @returns the cached data or undefined
 */
const passthrough = (args: Variables, cache: Cache, info: ResolveInfo) =>
  cache.resolve(info.parentTypeName, info.fieldName, args);

export function createOmnigraphUrqlClient(ensNodeUrl: string): Client {
  const url = new URL("/api/omnigraph", ensNodeUrl).href;

  return new Client({
    url,
    exchanges: [
      cacheExchange({
        schema: introspection,
        keys: {
          // by default, all Entities are assumed to match the Relay spec, and graphcache treats
          // them as keyable by `id`. if it encounters an Entity with no `id` field and no other
          // special handling here in the cacheExchange.keys definitions, it will issue a warning.

          // AccountIds are keyable by (chainId, address)
          AccountId: (data) => {
            // TODO: expose some validation and serialization logic from enssdk
            const accountId = data as unknown as AccountId;

            // TODO: format this as a CAIP AccountId rather than this simple key
            return `${accountId.chainId}-${accountId.address}`;
          },

          // These entities are Embedded Data and don't have a relevant key
          Label: EMBEDDED_DATA,
          WrappedBaseRegistrarRegistration: EMBEDDED_DATA,
        },
        resolvers: {
          // TODO: we could add bigint parsing to the relevant fields, but not sure how to do so
          // automatically, without falling out of sync with the actual api
          // @see https://nearform.com/open-source/urql/docs/graphcache/local-resolvers/#transforming-records

          // TODO: maybe there's a better way to import/cast the type of args in these local resolvers?

          Query: {
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
              const address = args.address as Address;
              return { __typename: "Account", id: address };
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
              if (by.contract)
                return { __typename: "Permissions", id: makePermissionsId(by.contract) };

              throw new Error("never");
            },
          },
        },
      }),
      fetchExchange,
    ],
  });
}
