import { mergeAbis } from "@ponder/utils";

import { AbstractReverseResolver } from "../abis/shared/AbstractReverseResolver";
import { LegacyPublicResolver } from "../abis/shared/LegacyPublicResolver";
import { Resolver } from "../abis/shared/Resolver";

/**
 * This Resolver ABI represents the set of all well-known Resolver events/methods, including:
 * - LegacyPublicResolver
 *   - TextChanged event without value
 * - IResolver
 *   - modern Resolver ABI, TextChanged with value
 * - ReverseResolvers
 *   - AbstractReverseResolver
 *
 * A Resolver contract is a contract that emits _any_ (not _all_) of the events specified here and
 * may or may not support any number of the methods available in this ABI.
 */
export const ResolverABI = mergeAbis([LegacyPublicResolver, Resolver, AbstractReverseResolver]);
