import { makeSupportsInterfaceReader } from "./eip-165";

/**
 * ENSIP-10 Wildcard Resolution Interface Id
 * @see https://docs.ens.domains/ensip/10
 */
const IExtendedResolverInterfaceId = "0x9061b923";

/**
 * Determines whether a Resolver contract supports ENSIP-10.
 */
export const isExtendedResolver = makeSupportsInterfaceReader(IExtendedResolverInterfaceId);
