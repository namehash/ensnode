import type { QueryExample } from "./types";

/**
 * Example query for fetching the latest registrations for a Domain by its canonical name.
 */
export const exampleLatestRegistrations = {
  sql: {
    codeSnippet: `SELECT
  d.canonical_name,
  r.start,
  r.expiry,
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
LIMIT 15;
`,
    result: [
      {
        canonical_name: "[67f53c740a0051f85075dc2383fb83a7b48d2984fc9ed9db56b334ca96d1d309].eth",
        start: "1779816216",
        expiry: "1811352216",
        grace_period: "7776000",
        base: "3125000000003490",
        premium: "0",
        registration_type: "BaseRegistrar",
        owner_id: "0x205d2686da3bf33f64c17f21462c51b5ead462cf",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x085bfc7f3695efa2e9d3f9717214d85474f40b4b3ef902b67d2bb49654679fa1",
      },
      {
        canonical_name: "coolorg.eth",
        start: "1779794160",
        expiry: "1811330160",
        grace_period: "7776000",
        base: "3125000000003490",
        premium: "0",
        registration_type: "BaseRegistrar",
        owner_id: "0x5f71c6074141d41d0e769689dc9830388a5c7e3e",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xe2a76df5554592c08c28946f750aad17d0c2bb3553c6dd2f0298e0f2fe873be3",
      },
      {
        canonical_name: "[1d79e56219bd305bbd3fa8ab125997beceebe63b8f6e12d0b6cb956e955549ca].eth",
        start: "1779785856",
        expiry: "1906016256",
        grace_period: "7776000",
        base: "12508561643849586",
        premium: "0",
        registration_type: "BaseRegistrar",
        owner_id: "0x07a811c0bd3f46733822df66d7e2d723e6f73fd6",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x8f9e9956842380910d836aa4ac85bc50bee0999824ea8b54412d02bc56d57c6c",
      },
      {
        canonical_name: "kevin-af.eth",
        start: "1779768924",
        expiry: "1874463324",
        grace_period: "7776000",
        base: "9383561643846096",
        premium: "0",
        registration_type: "BaseRegistrar",
        owner_id: "0x6a89280251f72918b6b143817201008b3d99d96e",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x49c87057b1dbe6a6bdfdcf9cc9b2bc12544bc3cd9fd01aa6ea8efb7dab89ca7e",
      },
      {
        canonical_name: "executor1.eth",
        start: "1779743592",
        expiry: "1937509992",
        grace_period: "7776000",
        base: "15633561643853076",
        premium: "0",
        registration_type: "BaseRegistrar",
        owner_id: "0xbb0274908a353d7c37a97ea1ea099352ee39734e",
        domain_id:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x56fc11b057812d300b43fd13136ee7e656fa9081e5a3063ed011224302b3658f",
      },
    ],
  },
  sdk: {
    codeSnippet: `import { and, asc, eq, ne, lte, sql } from "drizzle-orm";

const limit = 5;

const recentRegistrations = await ensDb
  .select({
    canonicalName: ensIndexerSchema.domain.canonicalName,
    expiry: ensIndexerSchema.registration.expiry,
    start: ensIndexerSchema.registration.start,
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
        canonicalName: "[67f53c740a0051f85075dc2383fb83a7b48d2984fc9ed9db56b334ca96d1d309].eth",
        expiry: "1811352216",
        start: "1779816216",
        registrationType: "BaseRegistrar",
        ownerId: "0x205d2686da3bf33f64c17f21462c51b5ead462cf",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x085bfc7f3695efa2e9d3f9717214d85474f40b4b3ef902b67d2bb49654679fa1",
      },
      {
        canonicalName: "coolorg.eth",
        expiry: "1811330160",
        start: "1779794160",
        registrationType: "BaseRegistrar",
        ownerId: "0x5f71c6074141d41d0e769689dc9830388a5c7e3e",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0xe2a76df5554592c08c28946f750aad17d0c2bb3553c6dd2f0298e0f2fe873be3",
      },
      {
        canonicalName: "[1d79e56219bd305bbd3fa8ab125997beceebe63b8f6e12d0b6cb956e955549ca].eth",
        expiry: "1906016256",
        start: "1779785856",
        registrationType: "BaseRegistrar",
        ownerId: "0x07a811c0bd3f46733822df66d7e2d723e6f73fd6",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x8f9e9956842380910d836aa4ac85bc50bee0999824ea8b54412d02bc56d57c6c",
      },
      {
        canonicalName: "kevin-af.eth",
        expiry: "1874463324",
        start: "1779768924",
        registrationType: "BaseRegistrar",
        ownerId: "0x6a89280251f72918b6b143817201008b3d99d96e",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x49c87057b1dbe6a6bdfdcf9cc9b2bc12544bc3cd9fd01aa6ea8efb7dab89ca7e",
      },
      {
        canonicalName: "executor1.eth",
        expiry: "1937509992",
        start: "1779743592",
        registrationType: "BaseRegistrar",
        ownerId: "0xbb0274908a353d7c37a97ea1ea099352ee39734e",
        domainId:
          "11155111-0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e-0x56fc11b057812d300b43fd13136ee7e656fa9081e5a3063ed011224302b3658f",
      },
    ],
  },
} satisfies QueryExample;
