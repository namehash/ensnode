import { cacheExchange } from "@urql/exchange-graphcache";
import type { AccountId } from "enssdk";
import { stringifyAccountId } from "enssdk";
import { introspection } from "enssdk/omnigraph";

import { byIdLookupResolvers } from "./by-id-lookup-resolvers";
import { localBigIntResolvers } from "./local-bigint-resolvers";
import { localConnectionResolvers } from "./local-connection-resolvers";
import { mergeResolverMaps } from "./merge-resolver-maps";

/**
 * Entities without keys are 'Embedded Data', and we tell graphcache about them to avoid warnings
 * about the inability to normalize them.
 *
 * @see https://nearform.com/open-source/urql/docs/graphcache/normalized-caching/#custom-keys-and-non-keyable-entities
 */
const EMBEDDED_DATA = () => null;

export const omnigraphCacheExchange = cacheExchange({
  schema: introspection,
  keys: {
    // by default, all Entities are assumed to match the Relay spec, and graphcache treats
    // them as keyable by `id`. if it encounters an Entity with no `id` field and no other
    // special handling here in the cacheExchange.keys definitions, it will issue a warning.

    // AccountIds are keyable by stringifying them
    AccountId: (data) => {
      if (!data.address) return null;
      if (!data.chainId) return null;

      return stringifyAccountId(data as unknown as AccountId);
    },

    // These entities are Embedded Data and don't have a relevant key
    Label: EMBEDDED_DATA,
    WrappedBaseRegistrarRegistration: EMBEDDED_DATA,
  },
  resolvers: mergeResolverMaps(
    // produce relayPagination() local resolvers for each t.connection in the schema
    localConnectionResolvers(introspection),

    // produce local resolvers that parse BigInt scalar fields from cached strings into native bigint
    localBigIntResolvers(introspection),

    // produce local cache resolvers for the Query.entity(by: { }) lookups
    byIdLookupResolvers,
  ),
});
