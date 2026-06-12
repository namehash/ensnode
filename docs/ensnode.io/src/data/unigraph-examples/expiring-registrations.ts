import { outputSource } from "./utils";
import type { QueryExample } from "./types";

const resultNote = outputSource("Alpha");

/**
 * Example query for fetching ENS registrations that are expiring soon.
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
        canonical_name: "artea.eth",
        start: "1686405839",
        expiry: "1781013839",
        grace_period: "7776000",
        owner_id: "0xcd421e50f622ce64b34be68195ca955b8bfd87c9",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x66c0bb79871615383d8dfda2db33e11bf7bce500296cdf744c02ed002dd34fbe",
      },
      {
        canonical_name: "happydad.eth",
        start: "1623291951",
        expiry: "1781013855",
        grace_period: "7776000",
        owner_id: "0x4e2da5a0f339bbb8044911289db6fc856b96ceb8",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xf193ccd69a8f1aa4f9a8db9436eaf72a76485f3326a8035282c2798b50f15f7a",
      },
      {
        canonical_name: "00h08.eth",
        start: "1749477923",
        expiry: "1781013923",
        grace_period: "7776000",
        owner_id: "0xd6f7483334dabfc269b6593404937ac47d8c14b7",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xfa69df157ceade1a0096790f985146fa8c4d739d53c0b5d19e9e3b91b1e69b20",
      },
      {
        canonical_name: "saasnft.eth",
        start: "1654786180",
        expiry: "1781013988",
        grace_period: "7776000",
        owner_id: "0x2fb477bf0db48926ca59d9d34c72424524cb9d51",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x317489d1004fe21a7c3377f67d47fa476890e73acbf96377e12fa1b0597460b0",
      },
      {
        canonical_name: "agris.eth",
        start: "1654786368",
        expiry: "1781014176",
        grace_period: "7776000",
        owner_id: "0xd26481ac94175b074f58900baf0dd0e597e8cf96",
        domain_id:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x0a8c71787f5029e883e4ce6aa20b35d7c29599b9658d92f8c44d48fdf09aeda3",
      },
    ],
    resultNote,
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
        canonicalName: "artea.eth",
        expiry: "1781013839",
        start: "1686405839",
        gracePeriod: "7776000",
        ownerId: "0xcd421e50f622ce64b34be68195ca955b8bfd87c9",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x66c0bb79871615383d8dfda2db33e11bf7bce500296cdf744c02ed002dd34fbe",
      },
      {
        canonicalName: "happydad.eth",
        expiry: "1781013855",
        start: "1623291951",
        gracePeriod: "7776000",
        ownerId: "0x4e2da5a0f339bbb8044911289db6fc856b96ceb8",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xf193ccd69a8f1aa4f9a8db9436eaf72a76485f3326a8035282c2798b50f15f7a",
      },
      {
        canonicalName: "00h08.eth",
        expiry: "1781013923",
        start: "1749477923",
        gracePeriod: "7776000",
        ownerId: "0xd6f7483334dabfc269b6593404937ac47d8c14b7",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xfa69df157ceade1a0096790f985146fa8c4d739d53c0b5d19e9e3b91b1e69b20",
      },
      {
        canonicalName: "saasnft.eth",
        expiry: "1781013988",
        start: "1654786180",
        gracePeriod: "7776000",
        ownerId: "0x2fb477bf0db48926ca59d9d34c72424524cb9d51",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x317489d1004fe21a7c3377f67d47fa476890e73acbf96377e12fa1b0597460b0",
      },
      {
        canonicalName: "agris.eth",
        expiry: "1781014176",
        start: "1654786368",
        gracePeriod: "7776000",
        ownerId: "0xd26481ac94175b074f58900baf0dd0e597e8cf96",
        domainId:
          "1-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x0a8c71787f5029e883e4ce6aa20b35d7c29599b9658d92f8c44d48fdf09aeda3",
      },
    ],
    resultNote,
  },
} satisfies QueryExample;
