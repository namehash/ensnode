/**
 * Order value type — string for NAME (canonicalName), number for DEPTH (canonicalDepth),
 * bigint for REGISTRATION_TIMESTAMP / REGISTRATION_EXPIRY. Null for unset.
 */
export type DomainOrderValue = string | number | bigint | null;
