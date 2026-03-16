import { makeSupportsInterfaceReader } from "./eip-165";

/**
 * DedicatedResolver InterfaceId
 * @see https://github.com/ensdomains/contracts-v2/blob/main/contracts/src/resolver/interfaces/IDedicatedResolverSetters.sol
 */
const IDedicatedResolverInterfaceId = "0x92349baa";

/**
 * Determines whether a Resolver contract supports ENSIP-10.
 */
export const isDedicatedResolver = makeSupportsInterfaceReader(IDedicatedResolverInterfaceId);
