import { mergeAbis } from "@ponder/utils";

import { LegacyPublicResolver } from "../abis/shared/LegacyPublicResolver";
import { Ownable } from "../abis/shared/Ownable";
import { Resolver } from "../abis/shared/Resolver";

/**
 * This Resolver ABI represents the set of all well-known Resolver events/methods, including:
 * - LegacyPublicResolver
 *   - TextChanged event without value
 * - IResolver
 *   - modern Resolver ABI
 * - Dedicated Resolver
 *   - Ownable
 *
 * A Resolver contract is a contract that emits _any_ (not _all_) of the events specified here and
 * may or may not support any number of the methods available in this ABI.
 */
export const ResolverABI = mergeAbis([LegacyPublicResolver, Resolver, Ownable]);
