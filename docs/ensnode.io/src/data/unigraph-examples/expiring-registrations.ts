import type { QueryExample } from "./types";

/**
 * Example query for fetching recent events for a Domain by its canonical name.
 */
export const exampleExpiringRegistrations = {
  sql: {
    codeSnippet: `SELECT
  d.canonical_name,
  r.start,
  r.expiry,
  r.grace_period,
  d.owner_id,
  d.id as domain_id
FROM "ensindexer_0".registrations r
JOIN "ensindexer_0".latest_registration_index lri
  ON r.domain_id = lri.domain_id
  AND r.registration_index = lri.registration_index
JOIN "ensindexer_0".domains d ON r.domain_id = d.id
WHERE r.expiry >= EXTRACT(EPOCH FROM NOW()) 
  AND r.expiry <= EXTRACT(EPOCH FROM NOW() + INTERVAL '3 days')
  AND d.canonical = true
ORDER BY r.expiry ASC
LIMIT 5;
`,
    result: [
      {
        canonical_name: "block-land.eth",
        start: "1717602456",
        expiry: "1780674456",
        grace_period: "7776000",
        owner_id: "0x95e488ed0d3497f8cf2392e35c9eb81812ef863c",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x4263eab7cb93cb3161f613e59357fce5de6646c9dab3682c388938231ca16fe6",
      },
      {
        canonical_name: "hagemz.eth",
        start: "1749139932",
        expiry: "1780675932",
        grace_period: "7776000",
        owner_id: "0xeb4bde48fb4ad1ab104eb1ef978fdd24e11d6a28",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x7886dc1e5b637005edf606d9e0f5cee78bd86a57e1378e1c76c3fa7557847659",
      },
      {
        canonical_name: "leogomez.eth",
        start: "1749152664",
        expiry: "1780688664",
        grace_period: "7776000",
        owner_id: "0x2f7970674b6410f90b8bc43d8188ef35ab3f1a9b",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x6c577a69aa94e39ee0ff1beedbd3385f405506bc35d88f47284056c1ceba5759",
      },
      {
        canonical_name: "ilanklein.eth",
        start: "1749156780",
        expiry: "1780692780",
        grace_period: "7776000",
        owner_id: "0x99969df2da9bf780cfd62d7cc22f77e5bdb332df",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x94877f55b294b34b0ac4952ad746f1c163a7e1aba16c41d113c558cd4f2bdff5",
      },
      {
        canonical_name: "iwms.eth",
        start: "1749157272",
        expiry: "1780693272",
        grace_period: "7776000",
        owner_id: "0xa098364308d3e400e2f1199675ac765adac4810f",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x13403c49bb9d168c7f18b830b5dd86f562e3e203fe2fc545927e5f609e3e6417",
      },
    ],
  },
  sdk: {
    codeSnippet: `import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

const limit = 5;

const expiringRegistrations = await ensDb
  .select({
    canonicalName: ensIndexerSchema.domain.canonicalName,
    expiry: ensIndexerSchema.registration.expiry,
    start: ensIndexerSchema.registration.start,
    gracePeriod: ensIndexerSchema.registration.gracePeriod,
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
      gte(ensIndexerSchema.registration.expiry, sql\`EXTRACT(EPOCH FROM NOW())\`),
      lte(
        ensIndexerSchema.registration.expiry,
        sql\`EXTRACT(EPOCH FROM NOW() + INTERVAL '3 days')\`,
      ),
      eq(ensIndexerSchema.domain.canonical, true),
    ),
  )
  .orderBy(asc(ensIndexerSchema.registration.expiry))
  .limit(limit);

console.log(expiringRegistrations);`,
    result: [
      {
        canonicalName: "block-land.eth",
        expiry: "1780674456",
        start: "1717602456",
        gracePeriod: "7776000",
        ownerId: "0x95e488ed0d3497f8cf2392e35c9eb81812ef863c",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x4263eab7cb93cb3161f613e59357fce5de6646c9dab3682c388938231ca16fe6",
      },
      {
        canonicalName: "hagemz.eth",
        expiry: "1780675932",
        start: "1749139932",
        gracePeriod: "7776000",
        ownerId: "0xeb4bde48fb4ad1ab104eb1ef978fdd24e11d6a28",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x7886dc1e5b637005edf606d9e0f5cee78bd86a57e1378e1c76c3fa7557847659",
      },
      {
        canonicalName: "leogomez.eth",
        expiry: "1780688664",
        start: "1749152664",
        gracePeriod: "7776000",
        ownerId: "0x2f7970674b6410f90b8bc43d8188ef35ab3f1a9b",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x6c577a69aa94e39ee0ff1beedbd3385f405506bc35d88f47284056c1ceba5759",
      },
      {
        canonicalName: "ilanklein.eth",
        expiry: "1780692780",
        start: "1749156780",
        gracePeriod: "7776000",
        ownerId: "0x99969df2da9bf780cfd62d7cc22f77e5bdb332df",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x94877f55b294b34b0ac4952ad746f1c163a7e1aba16c41d113c558cd4f2bdff5",
      },
      {
        canonicalName: "iwms.eth",
        expiry: "1780693272",
        start: "1749157272",
        gracePeriod: "7776000",
        ownerId: "0xa098364308d3e400e2f1199675ac765adac4810f",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x13403c49bb9d168c7f18b830b5dd86f562e3e203fe2fc545927e5f609e3e6417",
      },
    ],
  },
} satisfies QueryExample;
