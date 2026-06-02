/**
 * A contact email address normalized by trimming and validated as a well-formed email.
 *
 * Values are validated with the same guarantees as Zod's `z.email()` (after trim).
 *
 * @see https://zod.dev/api?id=emails#emails
 */
export type Email = string;
