import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha Sepolia");

/**
 * Example query for fetching the latest registrations across all Domains.
 */
export const exampleLatestRegistrations = {
  sql: {
    codeSnippet: `SELECT
  d.canonical_name,
  r.start,
  r.expiry,
  r.grace_period,
  r.base,
  r.premium,
  r.type as registration_type,
  d.owner_id,
  d.id as domain_id
FROM "ensindexer_0".registrations r
JOIN "ensindexer_0".latest_registration_index lri
  ON r.domain_id = lri.domain_id
  AND r.registration_index = lri.registration_index
JOIN "ensindexer_0".domains d ON r.domain_id = d.id
WHERE r.start <= EXTRACT(EPOCH FROM NOW())
  AND d.canonical = true
  AND r.type <> 'NameWrapper'
ORDER BY r.start DESC
LIMIT 5;
`,
    result: [
      {
        canonical_name: "karsten.base.eth",
        start: "1762698085",
        expiry: "1794234086",
        grace_period: "7776000",
        registration_type: "BaseRegistrar",
        owner_id: "0x2426bd7d89230ce5cd4015c47811445b8a6c8f0b",
        domain_id:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0xa0cf65983e0b8f2363aaac795c5844c44131ce0b94568e57fcb5e2e5115a87e3",
      },
      {
        canonical_name: "urolinkfu.base.eth",
        start: "1762698015",
        expiry: "1794234016",
        grace_period: "7776000",
        registration_type: "BaseRegistrar",
        owner_id: "0x66c52ecef41ee67119cfbcaf88d2097ec1eec5f0",
        domain_id:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0x1be1354816d460696b36c96b2fa75e3f1fbed97e95720603553d513724d1e233",
      },
      {
        canonical_name: "quantumrepeater.eth",
        start: "1762697939",
        expiry: "1794233939",
        grace_period: "7776000",
        registration_type: "BaseRegistrar",
        owner_id: "0x53e1c07bf0282e84fd5b600b2b1f90e8bc14d4f1",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xd06fb94af8abfbe4cfe0a6f5fed589ce5bae7a28bd0347241d0903b3d9893233",
      },
      {
        canonical_name: "spirich.base.eth",
        start: "1762697929",
        expiry: "1794233930",
        grace_period: "7776000",
        registration_type: "BaseRegistrar",
        owner_id: "0xe46bc24cd3c5f2f73e8604b994d18675c64e0019",
        domain_id:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0x94f8855a549a1ba319531b8acb1d0130b6ec095bf27e0de3b84e05207a2b154e",
      },
      {
        canonical_name: "hexiuling3.base.eth",
        start: "1762697917",
        expiry: "1794255517",
        grace_period: "7776000",
        registration_type: "BaseRegistrar",
        owner_id: "0x4b2945016ef05155863723cf07740b2d25d5db19",
        domain_id:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0x0944dfcb1ef210d64d6ac38637c57012fa356831d58d31a6ecc9d18484668cd7",
      },
    ],
    resultNote,
  },
  sdk: {
    codeSnippet: `import { and, desc, eq, ne, lte, sql } from "drizzle-orm";

const limit = 5;

const recentRegistrations = await ensDb
  .select({
    canonicalName: ensIndexerSchema.domain.canonicalName,
    start: ensIndexerSchema.registration.start,
    expiry: ensIndexerSchema.registration.expiry,
    gracePeriod: ensIndexerSchema.registration.gracePeriod,
    base: ensIndexerSchema.registration.base,
    premium: ensIndexerSchema.registration.premium,
    registrationType: ensIndexerSchema.registration.type,
    ownerId: ensIndexerSchema.domain.ownerId,
    domainId: ensIndexerSchema.domain.id,
  })
  .from(ensIndexerSchema.registration)
  .innerJoin(
    ensIndexerSchema.latestRegistrationIndex,
    and(
      eq(
        ensIndexerSchema.registration.domainId,
        ensIndexerSchema.latestRegistrationIndex.domainId,
      ),
      eq(
        ensIndexerSchema.registration.registrationIndex,
        ensIndexerSchema.latestRegistrationIndex.registrationIndex,
      ),
    ),
  )
  .innerJoin(
    ensIndexerSchema.domain,
    eq(ensIndexerSchema.registration.domainId, ensIndexerSchema.domain.id),
  )
  .where(
    and(
      lte(ensIndexerSchema.registration.start, sql\`EXTRACT(EPOCH FROM NOW())\`),
      eq(ensIndexerSchema.domain.canonical, true),
      ne(ensIndexerSchema.registration.type, "NameWrapper"),
    ),
  )
  .orderBy(desc(ensIndexerSchema.registration.start))
  .limit(limit);

console.log(recentRegistrations);`,
    result: [
      {
        canonicalName: "karsten.base.eth",
        start: "1762698085",
        expiry: "1794234086",
        gracePeriod: "7776000",
        registrationType: "BaseRegistrar",
        ownerId: "0x2426bd7d89230ce5cd4015c47811445b8a6c8f0b",
        domainId:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0xa0cf65983e0b8f2363aaac795c5844c44131ce0b94568e57fcb5e2e5115a87e3",
      },
      {
        canonicalName: "urolinkfu.base.eth",
        start: "1762698015",
        expiry: "1794234016",
        gracePeriod: "7776000",
        registrationType: "BaseRegistrar",
        ownerId: "0x66c52ecef41ee67119cfbcaf88d2097ec1eec5f0",
        domainId:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0x1be1354816d460696b36c96b2fa75e3f1fbed97e95720603553d513724d1e233",
      },
      {
        canonicalName: "quantumrepeater.eth",
        start: "1762697939",
        expiry: "1794233939",
        gracePeriod: "7776000",
        registrationType: "BaseRegistrar",
        ownerId: "0x53e1c07bf0282e84fd5b600b2b1f90e8bc14d4f1",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xd06fb94af8abfbe4cfe0a6f5fed589ce5bae7a28bd0347241d0903b3d9893233",
      },
      {
        canonicalName: "spirich.base.eth",
        start: "1762697929",
        expiry: "1794233930",
        gracePeriod: "7776000",
        registrationType: "BaseRegistrar",
        ownerId: "0xe46bc24cd3c5f2f73e8604b994d18675c64e0019",
        domainId:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0x94f8855a549a1ba319531b8acb1d0130b6ec095bf27e0de3b84e05207a2b154e",
      },
      {
        canonicalName: "hexiuling3.base.eth",
        start: "1762697917",
        expiry: "1794255517",
        gracePeriod: "7776000",
        registrationType: "BaseRegistrar",
        ownerId: "0x4b2945016ef05155863723cf07740b2d25d5db19",
        domainId:
          "8453-0xb94704422c2a1e396835a571837aa5ae53285a95-0x0944dfcb1ef210d64d6ac38637c57012fa356831d58d31a6ecc9d18484668cd7",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
