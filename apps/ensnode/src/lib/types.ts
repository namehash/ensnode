/**
 * An owned name for a plugin. Must end with `eth`.
 *
 * Owned names are used to distinguish between plugins that handle different
 * subnames. For example, a plugin that handles `eth` subnames will have an
 * owned name of `eth`, while a plugin that handles `base.eth` subnames will
 * have an owned name of `base.eth`.
 */
export type OwnedName = string;
