import { Name } from "@ensnode/ensnode-sdk";
import { Address, isAddress } from "viem";

import { resolveForward } from "@/api/lib/forward-resolution";
import { makeEmptyResolverRecordsResponse } from "@/api/lib/resolver-records-response";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";
import { resolveReverse } from "@/api/lib/reverse-resolution";

/**
 * Performs forward resolution of `selection` for `addressOrName`, performing reverse resolution
 * for the `addressOrName` if necessary.
 *
 * TODO: chain-specific reverse resolution
 * TODO: include reverse-resolution results in response so consumer gets access to primary name and
 * forward records in a single request. perhaps just merge them actually, that'd be nice. a
 * mergeResolverRecordsResponse might be a helpful util
 */
export async function resolveAutomatic<SELECTION extends ResolverRecordsSelection>(
  addressOrName: Address | Name,
  selection: SELECTION,
) {
  // resolve name if necessary
  let name: Name | null;
  if (isAddress(addressOrName)) {
    const results = await resolveReverse(addressOrName);
    name = results?.name || null;
  } else {
    name = addressOrName;
  }

  // if we don't have a name to query, return empty response
  if (!name) return makeEmptyResolverRecordsResponse(selection);

  // otherwise, perform forward resolution as normal
  return resolveForward(name, selection);
}
