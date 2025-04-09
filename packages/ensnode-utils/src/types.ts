import type { Hex } from "viem";

/**
 * A hash value that uniquely identifies a single ENS name.
 * Result of `namehash` function as specified in ENSIP-1.
 *
 * @example
 * ```
 * namehash("vitalik.eth") === "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835"
 * ```
 * @link https://docs.ens.domains/ensip/1#namehash-algorithm
 */
export type Node = Hex;

/**
 * A LabelHash is the result of the labelhash function (which is just keccak256) on a label.
 *
 * @link https://docs.ens.domains/terminology#labelhash
 */
export type LabelHash = Hex;

/**
 * A Label is a single part of an ENS Name.
 *
 * @link https://docs.ens.domains/terminology#label
 */
export type Label = string;

/**
 * An EncodedLabelHash represents a LabelHash when used in an ENS name.
 *
 */
export type EncodedLabelHash = `[${string}]`;

/**
 * A Name represents a human-readable ENS name.
 *
 * ex: vitalik.eth
 */
export type Name = string;
