import type { Hex } from "viem";

/**
 * An owned name for a plugin. Must end with `eth`.
 *
 * Owned names are used to distinguish between plugins that handle different
 * subnames. For example, a plugin that handles `eth` subnames will have an
 * owned name of `eth`, while a plugin that handles `base.eth` subnames will
 * have an owned name of `base.eth`.
 */
export type OwnedName = `${string}eth`;

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
 * A hash value that identifies only a single part or "label" of an ENS name.
 * The labelhash is just the Keccak-256 output for the label.
 *
 * @link https://docs.ens.domains/ensip/1#labelhash-algorithm
 */
export type Labelhash = Hex;
