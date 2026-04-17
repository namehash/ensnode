import type { Cache, ResolveInfo, Resolver, Variables } from "@urql/exchange-graphcache";
import {
  type AccountId,
  type Address,
  makePermissionsId,
  makeRegistryId,
  makeResolverId,
  type PermissionsId,
  type RegistryId,
  type ResolverId,
} from "enssdk";

/**
 * This local resolver delegates to graphcache's built-in cache resolution with the full argument set,
 * effectively telling urql 'not found locally' and to fetch from the network.
 */
const passthrough = (args: Variables, cache: Cache, info: ResolveInfo) =>
  cache.resolve(info.parentTypeName, info.fieldName, args);

export const byIdLookupResolvers: Record<string, Record<string, Resolver>> = {
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
      const by = args.by as { id?: Address; address?: Address };

      if (by.id) return { __typename: "Account", id: by.id };
      if (by.address) return { __typename: "Account", id: by.address };

      return passthrough(args, cache, info);
    },
    registry(parent, args, cache, info) {
      const by = args.by as { id?: RegistryId; contract?: AccountId };

      if (by.id) return { __typename: "Registry", id: by.id };
      if (by.contract) return { __typename: "Registry", id: makeRegistryId(by.contract) };

      return passthrough(args, cache, info);
    },
    resolver(parent, args, cache, info) {
      const by = args.by as { id?: ResolverId; contract?: AccountId };

      if (by.id) return { __typename: "Resolver", id: by.id };
      if (by.contract) return { __typename: "Resolver", id: makeResolverId(by.contract) };

      return passthrough(args, cache, info);
    },
    permissions(parent, args, cache, info) {
      const by = args.by as { id?: PermissionsId; contract?: AccountId };

      if (by.id) return { __typename: "Permissions", id: by.id };
      if (by.contract) return { __typename: "Permissions", id: makePermissionsId(by.contract) };

      return passthrough(args, cache, info);
    },
  },
};
