import type { CoinType, ContentType, InterfaceId } from "enssdk";

/**
 * Encodes a selection of Resolver records in the context of a specific Name.
 */
export interface ResolverRecordsSelection {
  /**
   * Whether to fetch the name's `name` record. This value is primarily used in the context of
   * Reverse Resolution.
   *
   * @see https://docs.ens.domains/ensip/19/#reverse-resolution
   */
  name?: boolean;

  /**
   * Which coinTypes to fetch address records for.
   */
  addresses?: CoinType[];

  /**
   * Which keys to fetch text records for.
   */
  texts?: string[];

  /**
   * Whether to fetch the ENSIP-7 contenthash record.
   */
  contenthash?: boolean;

  /**
   * Whether to fetch the PubkeyResolver (x, y) pair.
   */
  pubkey?: boolean;

  /**
   * Which ABI content-type bitmask to fetch. The resolver returns the first stored ABI whose
   * bit is present in the mask (lowest bit first).
   */
  abi?: ContentType;

  /**
   * Which ERC-165 interface implementers to fetch, keyed by InterfaceId.
   */
  interfaces?: InterfaceId[];

  /**
   * Whether to fetch the IDNSZoneResolver zonehash record.
   */
  dnszonehash?: boolean;

  /**
   * Whether to fetch the IVersionableResolver version.
   */
  version?: boolean;
}

export const isSelectionEmpty = (selection: ResolverRecordsSelection) =>
  !selection.name &&
  !selection.addresses?.length &&
  !selection.texts?.length &&
  !selection.contenthash &&
  !selection.pubkey &&
  !selection.dnszonehash &&
  selection.abi === undefined &&
  !selection.interfaces?.length &&
  !selection.version;
