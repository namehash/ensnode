/**
 * EFP List Storage Location utilities
 */

import type { ENSDeploymentChain } from "@ensnode/ens-deployments";
import type { Address } from "viem";
import { base, baseSepolia, mainnet, optimism, optimismSepolia, sepolia } from "viem/chains";
import { getAddress } from "viem/utils";
import { prettifyError, z } from "zod/v4";

/**
 * Enum defining recognized List Storage Location Types
 *
 * Based on documentation at:
 * https://docs.efp.app/design/list-storage-location/#location-types
 */
export enum ListStorageLocationType {
  /**
   * EVMContract Data List Storage Location Type encoding:
   * 32-byte chain ID + 20-byte contract address + 32-byte slot
   */
  EVMContract = 1,
}

/**
 * Enum defining recognized List Storage Location Versions
 *
 * Based on documentation at:
 * https://docs.efp.app/design/list-storage-location/#serialization
 */
export enum ListStorageLocationVersion {
  V1 = 1,
}

/**
 * Max value for the EFP Chain ID
 *
 * Matching the available range of the signed 4-byte `integer` type.
 *
 * @link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC
 */
const EFP_CHAIN_ID_TYPE_MAX_VALUE = 2_147_483_647;

/**
 * Application data model for EFP Deployment Chain ID.
 *
 * EFP has an allowlisted set of supported chains. As of June 13, 2025
 * the max allowlisted EFP chain ID is 11,155,420 (OP Sepolia) and
 * therefore it is safe for us to use integer (a signed 4-byte integer) to
 * store this chain ID, even though technically EVM chainIds are uint256 (32-bytes).
 *
 * Note:
 * In the future, there might be a case when the max allowlisted EFP chain ID
 * requires setting `EFPDeploymentChainId` type to `bigint` to support
 * every allowlisted EFP chain ID. For example, it will happen when any of
 * allowlisted EFP chain IDs is greater than the max value for
 * a signed 4-byte integer (EFP_CHAIN_ID_TYPE_MAX_VALUE).
 */
type EFPDeploymentChainId = number;

/**
 * Base List Storage Location
 */
interface BaseListStorageLocation<
  LSLVersion extends ListStorageLocationVersion,
  LSLType extends ListStorageLocationType,
> {
  /**
   * The version of the List Storage Location.
   *
   * This is used to ensure compatibility and facilitate future upgrades.
   */
  version: LSLVersion;

  /**
   * The type of the List Storage Location.
   *
   * This identifies the kind of data the data field contains.
   */
  type: LSLType;
}

/**
 * List Storage Location Contract
 *
 * Describes data model for the EVM contract Location Type as
 * a specialized version of BaseListStorageLocation interface,
 * where the location type is always 1, and, for now, the version is always 1.
 *
 * Documented based on https://docs.efp.app/design/list-storage-location/
 */
export interface ListStorageLocationContract
  extends BaseListStorageLocation<
    ListStorageLocationVersion.V1,
    ListStorageLocationType.EVMContract
  > {
  /**
   * EVM chain ID of the chain where the EFP list records are stored.
   */
  chainId: EFPDeploymentChainId;

  /**
   * Contract address on chainId where the EFP list records are stored.
   */
  listRecordsAddress: Address;

  /**
   * The 32-byte value that specifies the storage slot of the EFP list records within the listRecordsAddress contract.
   * This disambiguates multiple lists stored within the same contract and
   * de-couples it from the EFP List NFT token id which is stored on the EFP deployment root chain and
   * inaccessible on other chains.
   */
  slot: bigint;
}

/**
 * An encoded List Storage Location is a bytes array with the following structure:
 * - `version`: A string representation of `uint8` value indicating the version of the List Storage Location. This is used to ensure compatibility and facilitate future upgrades.
 * - `type`: A string representation of `uint8` value indicating the type of list storage location. This identifies the kind of data the data field contains..
 * - `data:` A string representation of a bytes array containing the actual data of the list storage location. The structure of this data depends on the location type.
 */
type EncodedLsl = string;

/**
 * Data structure helpful for parsing an EncodedLsl.
 */
interface SlicedLslContract {
  /**
   * The version of the List Storage Location.
   *
   * Formatted as the string representation of a `uint8` value.
   * This is used to ensure compatibility and facilitate future upgrades.
   */
  version: string;

  /**
   * The type of the List Storage Location.
   *
   * Formatted as the string representation of a `uint8` value.
   * This identifies the kind of data the data field contains.
   */
  type: string;

  /**
   * The EVM chain ID of the chain where the EFP list records are stored.
   *
   * Formatted as the string representation of a `uint256` value.
   */
  chainId: string;

  /**
   * Contract address on chainId where the EFP list records are stored.
   *
   * Formatted as the string representation of a 20-byte unsigned integer value.
   */
  listRecordsAddress: string;

  /**
   * The storage slot of the EFP list records within the listRecordsAddress contract.
   *
   * Formatted as the string representation of a `uint256` value.
   *
   * This disambiguates multiple lists stored within the same contract and
   * de-couples it from the EFP List NFT token id which is stored on the EFP deployment root chain and
   * inaccessible on other chains.
   */
  slot: string;
}

/**
 * Convert an EncodedLsl into a SlicedLslContract.
 *
 * @param encodedLsl
 * @returns {SlicedLslContract} Sliced LSL Contract.
 * @throws {Error} when input param is not of expected length
 */
function sliceEncodedLslContract(encodedLsl: EncodedLsl): SlicedLslContract {
  if (encodedLsl.length !== 174) {
    throw new Error(
      "Encoded List Storage Location values for a LSL v1 Contract must be a 174-character long string",
    );
  }

  return {
    // Extract the first byte after the 0x (2 hex characters = 1 byte)
    version: encodedLsl.slice(2, 4),

    // Extract the second byte
    type: encodedLsl.slice(4, 6),

    // Extract the next 32 bytes to get the chain id
    chainId: encodedLsl.slice(6, 70),

    // Extract the address (40 hex characters = 20 bytes)
    listRecordsAddress: encodedLsl.slice(70, 110),

    // Extract last 32 bytes to get the slot
    slot: encodedLsl.slice(110, 174),
  } satisfies SlicedLslContract;
}

/**
 * Create a zod schema covering validations and invariants enforced with {@link decodeListStorageLocationContract} parser.
 * @param {EFPDeploymentChainId[]} efpDeploymentChainIds List of IDs for chains that the EFP protocol has been deployed on.
 */
const createEfpLslContractSchema = (efpDeploymentChainIds: EFPDeploymentChainId[]) =>
  z.object({
    version: z.literal("01").transform(() => ListStorageLocationVersion.V1),

    type: z.literal("01").transform(() => ListStorageLocationType.EVMContract),

    chainId: z
      .string()
      .length(64)
      .transform((v) => BigInt(`0x${v}`))
      // mapping EVM's Chain ID type into the `EFPDeploymentChainId` type
      .transform((v) => Number(v) as EFPDeploymentChainId)
      // invariant: every allowlisted EFP chain ID is under the EFPDeploymentChainId value limit
      .refine(
        (v) => efpDeploymentChainIds.every((chainId) => chainId <= EFP_CHAIN_ID_TYPE_MAX_VALUE),
        {
          message: `Every chainId from efpDeploymentChainIds must fit into the signed 4-byte integer value range.`,
        },
      )
      // invariant: chainId is from one of the EFP Deployment Chain IDs
      // https://docs.efp.app/production/deployments/
      .refine((v) => efpDeploymentChainIds.includes(v), {
        message: `chainId must be one of the EFP deployment Chain IDs: ${efpDeploymentChainIds.join(", ")}`,
      }),

    listRecordsAddress: z
      .string()
      .length(40)
      .transform((v) => `0x${v}`)
      // ensure EVM address correctness and map it into lowercase for increased data model safety
      .transform((v) => getAddress(v).toLowerCase() as Address),

    slot: z
      .string()
      .length(64)
      .transform((v) => BigInt(`0x${v}`)),
  });

// NOTE: based on code from https://github.com/ethereumfollowprotocol/onchain/blob/f3c970e/src/efp.ts#L95-L123
/**
 * Decodes an EncodedLsl into a ListStorageLocationContract.
 *
 * @param {ENSDeploymentChain} ensDeploymentChain - The ENS Deployment Chain
 * @param {EncodedLsl} encodedLsl - The encoded List Storage Location string to parse.
 * @returns A decoded {@link ListStorageLocationContract} object.
 * @throws An error if parsing could not be completed successfully.
 */
export function decodeListStorageLocationContract(
  ensDeploymentChain: ENSDeploymentChain,
  encodedLsl: EncodedLsl,
): ListStorageLocationContract {
  const slicedLslContract = sliceEncodedLslContract(encodedLsl);
  const efpDeploymentChainIds = getEFPDeploymentChainIds(ensDeploymentChain);
  const efpLslContractSchema = createEfpLslContractSchema(efpDeploymentChainIds);

  const parsed = efpLslContractSchema.safeParse(slicedLslContract);

  if (!parsed.success) {
    throw new Error(
      "Failed to decode the encoded List Storage Location contract object: \n" +
        prettifyError(parsed.error) +
        "\n",
    );
  }

  return parsed.data;
}

/**
 * Get the list of EFP Deployment Chain IDs for the ENS Deployment Chain.
 *
 * @param ensDeploymentChain
 * @returns list of EFP Deployment Chain IDs
 */
export function getEFPDeploymentChainIds(
  ensDeploymentChain: ENSDeploymentChain,
): EFPDeploymentChainId[] {
  switch (ensDeploymentChain) {
    case "mainnet":
      return [base.id, optimism.id, mainnet.id];
    case "sepolia":
      return [baseSepolia.id, optimismSepolia.id, sepolia.id];
    default:
      throw new Error(
        `EFP Deployment chainIds are not configured for the ${ensDeploymentChain} ENS Deployment Chain`,
      );
  }
}

/**
 * Unique EFP List Storage Location ID
 *
 * Example:
 * `${version}-${type}-${chainId}-${listRecordsAddress}-${slot}`
 */
export type ListStorageLocationId = string;

/**
 * Makes a unique EFP List Storage Location ID.
 *
 * @param {ListStorageLocationContract} listStorageLocationContract a decoded List Storage Location Contract object
 * @returns a unique List Storage Location ID
 */
export const makeListStorageLocationId = ({
  version,
  type,
  chainId,
  listRecordsAddress,
  slot,
}: ListStorageLocationContract): ListStorageLocationId =>
  [
    version.toString(),
    type.toString(),
    chainId.toString(),
    listRecordsAddress.toLowerCase(),
    slot.toString(),
  ].join("-");
