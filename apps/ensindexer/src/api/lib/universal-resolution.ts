import { resolveForward } from "@/api/lib/forward-resolution";
import { resolveReverse } from "@/api/lib/reverse-resolution";
import { ResolverRecordsSelection, makeEmptyResolverRecordsResponse } from "@/lib/lib-resolution";
import { Name } from "@ensnode/ensnode-sdk";
import { Address, isAddress } from "viem";

/**
 * Performs forward resolution of `selection` for `addressOrName`, performing reverse resolution
 * for the `addressOrName` if necessary.
 */
export async function resolveUniversal<SELECTION extends ResolverRecordsSelection>(
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
