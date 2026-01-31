/**
 * Internal APIs
 *
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ens-referrals package.
 *
 * This file can never be included in the NPM package for ENSReferrals.
 *
 * The only way to import functionality from this file is to
 * use `@namehash/ens-referrals/internal` path. This path is available in any
 * app/package in the monorepo which requires `@namehash/ens-referrals` dependency.
 */

export * from "./api/zod-schemas";
