import { makeSupportsInterfaceReader } from "./eip-165";

/**
 * DedicatedResolver InterfaceId
 * @see https://github.com/ensdomains/namechain/blob/main/contracts/src/common/resolver/interfaces/IDedicatedResolverSetters.sol#L9
 */
const IDedicatedResolverInterfaceId = "0x92349baa";

/**
 * Determines whether a Resolver contract supports ENSIP-10.
 */
export const isDedicatedResolver = makeSupportsInterfaceReader(IDedicatedResolverInterfaceId);
