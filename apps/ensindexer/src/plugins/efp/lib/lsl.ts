/**
 * EFP List Storage Location utilities
 */

import type { ENSNamespaceId } from "@ensnode/datasources";
import type { Hex } from "viem";
import { prettifyError, z } from "zod/v4";
import { type EFPDeploymentChainId, getEFPDeploymentChainIds } from "./chains";
import { type EvmAddress, parseEvmAddress } from "./utils";

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
  listRecordsAddress: EvmAddress;

  /**
   * The 32-byte value that specifies the storage slot of the EFP list records within the listRecordsAddress contract.
   * This disambiguates multiple lists stored within the same contract and
   * de-couples it from the EFP List NFT token id which is stored on the EFP deployment root chain and
   * inaccessible on other chains.
   */
  slot: bigint;
}

/**
 * Encoded List Storage Location
 *
 * An encoded List Storage Location is a string formatted as the lowercase hexadecimal representation of a bytes array with the following structure:
 * - `version`: A string representation of `uint8` value indicating the version of the List Storage Location. This is used to ensure compatibility and facilitate future upgrades.
 * - `type`: A string representation of `uint8` value indicating the type of list storage location. This identifies the kind of data the data field contains..
 * - `data:` A string representation of a bytes array containing the actual data of the list storage location. The structure of this data depends on the location type.
 *
 * Note: To prevent any `Hex` value from being able to be represented as an Encoded LSL, we apply a brand to the type.
 */
export type EncodedLsl = Hex & { readonly __brand: "EncodedLsl" };

/**
 * Parse a string value into an Encoded LSL.
 */
export function parseEncodedLsl(value: string): EncodedLsl {
  if (!value.startsWith("0x")) {
    throw new Error("Encoded LSL must start with '0x'");
  }

  return value.toLowerCase() as EncodedLsl;
}

/**
 * An encoded representation of an EVMContract List Storage Location.
 *
 * - `version`: A string representation of `uint8` value indicating the version of the List Storage Location. This is used to ensure compatibility and facilitate future upgrades.
 * - `type`: A string representation of `uint8` value set to {@link ListStorageLocationType.EVMContract}
 * - `data:` A string representation of a bytes array containing the actual data of the list storage location. The structure of this data depends on the location type.
 *
 * Note: To prevent any `Hex` value from being able to be represented as an Encoded LSL, we apply a brand to the type.
 */
export type EncodedLslContract = `0x0101${string}` & EncodedLsl;

/**
 * Intermediate data structure to help parse an {@link EncodedLsl} into an {@link ListStorageLocationContract}.
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
 * Validate encoded representation of an EVMContract LSL.
 *
 * @param {EncodedLsl} encodedLsl
 * @throws {Error} when the encodedLsl is not of expected length of a V1 LSL for an EVM Contract
 * @throws {Error} when the encodedLsl is not of expected EVMContract type
 */
export function validateEncodedLslContract(encodedLsl: EncodedLsl): void {
  if (encodedLsl.length !== 174) {
    throw new Error(
      "Encoded List Storage Location values for a LSL v1 Contract must be a 174-character long string",
    );
  }

  const evmContractTypePadded = ListStorageLocationType.EVMContract.toString(2).padStart(2, "0");
  const encodedLslType = encodedLsl.slice(4, 6);

  if (encodedLslType !== evmContractTypePadded) {
    throw new Error(
      `Encoded List Storage Location type value for an EVMContract LSL must be set to ${evmContractTypePadded}`,
    );
  }
}

/**
 *  Check if the provided encodedLsl is a valid {@link EncodedLslContract}.
 *
 * @param {EncodedLsl} encodedLsl - Encoded representation of an EVMContract List Storage Location.
 * @returns {boolean} true if the encodedLsl is a valid EncodedLslContract, false otherwise.
 */
export function isEncodedLslContract(encodedLsl: EncodedLsl): encodedLsl is EncodedLslContract {
  try {
    validateEncodedLslContract(encodedLsl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert an encoded representation of a EMVContract LSL into a SlicedLslContract.
 *
 * @param encodedLslContract encoded representation of an EVMContract LSL.
 * @returns {SlicedLslContract} Sliced LSL EVMContract.
 */
function sliceEncodedLslContract(encodedLslContract: EncodedLslContract): SlicedLslContract {
  return {
    // Extract the first byte after the 0x (2 hex characters = 1 byte)
    version: encodedLslContract.slice(2, 4),

    // Extract the second byte
    type: encodedLslContract.slice(4, 6),

    // Extract the next 32 bytes to get the chain id
    chainId: encodedLslContract.slice(6, 70),

    // Extract the address (40 hex characters = 20 bytes)
    listRecordsAddress: encodedLslContract.slice(70, 110),

    // Extract last 32 bytes to get the slot
    slot: encodedLslContract.slice(110, 174),
  } satisfies SlicedLslContract;
}

/**
 * Create a zod schema covering validations and invariants enforced with {@link decodeListStorageLocationContract} parser.
 * This schema will be used to parse value of the {@link SlicedLslContract} type into {@link ListStorageLocationContract} type.
 *
 * @param {ENSNamespaceId} ensNamespaceID Selected ENS Namespace ID
 */
const createEfpLslContractSchema = (ensNamespaceId: ENSNamespaceId) => {
  const efpDeploymentChainIds = getEFPDeploymentChainIds(ensNamespaceId);

  return z.object({
    version: z.literal("01").transform(() => ListStorageLocationVersion.V1),

    type: z.literal("01").transform(() => ListStorageLocationType.EVMContract),

    chainId: z
      .string()
      .length(64)
      // prep: map string representation of a `uint256` chainId value into bigint
      .transform((v) => BigInt(`0x${v}`))
      // invariant: chainId can be converted into a positive safe integer
      .refine((v) => v > 0 && v <= Number.MAX_SAFE_INTEGER, {
        message: "chainId must be in the accepted range",
      })
      // prep: map a bigint chainId value into number
      .transform((v) => Number(v))
      // invariant: chainId is from one of the allowlisted EFP Deployment Chain IDs for the ENS Namespace ID
      // https://docs.efp.app/production/deployments/
      .refine((v) => efpDeploymentChainIds.includes(v), {
        message: `chainId must be one of the EFP deployment Chain IDs defined for the ENSNamespace "${ensNamespaceId}": ${efpDeploymentChainIds.join(", ")}`,
      }),

    listRecordsAddress: z
      .string()
      .length(40)
      .transform((v) => `0x${v}`)
      // ensure EVM address correctness and map it into lowercase for ease of equality comparisons
      .transform((v) => parseEvmAddress(v)),

    slot: z
      .string()
      .length(64)
      .transform((v) => BigInt(`0x${v}`)),
  });
};

// NOTE: based on code from https://github.com/ethereumfollowprotocol/onchain/blob/f3c970e/src/efp.ts#L95-L123
/**
 * Decodes an EncodedLsl into a ListStorageLocationContract.
 *
 * @param {ENSNamespaceId} ensNamespaceId - The ENS Namespace ID to use for decoding.
 * @param {EncodedLslContract} encodedLslContract - The encoded V1 EVMContract List Storage Location string to parse.
 * @returns A decoded {@link ListStorageLocationContract} object.
 * @throws An error if parsing could not be completed successfully.
 */
export function decodeListStorageLocationContract(
  ensNamespaceId: ENSNamespaceId,
  encodedLslContract: EncodedLslContract,
): ListStorageLocationContract {
  const slicedLslContract = sliceEncodedLslContract(encodedLslContract);
  const efpLslContractSchema = createEfpLslContractSchema(ensNamespaceId);

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
