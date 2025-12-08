import type { Address, PublicClient } from "viem";

import { supportsInterface } from "./eip-165";

/**
 * ENSIP-10 Wildcard Resolution Interface Id
 * @see https://docs.ens.domains/ensip/10
 */
const ENSIP10_INTERFACE_ID = "0x9061b923";

/**
 * Determines whether a Resolver contract supports ENSIP-10.
 */
export async function supportsENSIP10Interface({
  address,
  publicClient,
}: {
  address: Address;
  publicClient: PublicClient;
}) {
  return await supportsInterface({
    address,
    interfaceId: ENSIP10_INTERFACE_ID,
    publicClient,
  });
}
