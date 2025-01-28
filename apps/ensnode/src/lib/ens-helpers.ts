import { uint256ToHex32 } from "ensnode-utils/subname-helpers";

/**
 * Registrar contracts operate exclusively on names that are a direct subdomain of an OwnedName.
 * Because of this, tokenIds that they emit are uint256-encoded `labelhash` values.
 *
 * - https://github.com/ensdomains/ens-contracts/blob/mainnet/contracts/ethregistrar/ETHRegistrarController.sol#L215
 * - https://github.com/base-org/basenames/blob/main/src/L2/RegistrarController.sol#L488
 * - https://github.com/Consensys/linea-ens/blob/main/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
export const decodeTokenIdToLabelhash = (tokenId: bigint) => uint256ToHex32(tokenId);
