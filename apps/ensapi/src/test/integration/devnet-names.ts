import { additionallyRegisteredNames } from "@ensnode/integration-test-env/devnet";

const STATIC_DEVNET_NAMES = [
  { name: "test.eth", canonical: "test.eth" },
  { name: "example.eth", canonical: "example.eth" },
  { name: "demo.eth", canonical: "demo.eth" },
  { name: "newowner.eth", canonical: "newowner.eth" },
  { name: "renew.eth", canonical: "renew.eth" },
  { name: "reregister.eth", canonical: "reregister.eth" },
  { name: "parent.eth", canonical: "parent.eth" },
  { name: "changerole.eth", canonical: "changerole.eth" },
  { name: "alias.eth", canonical: "alias.eth" },
  { name: "sub2.parent.eth", canonical: "sub2.parent.eth" },
  { name: "sub1.sub2.parent.eth", canonical: "sub1.sub2.parent.eth" },
  { name: "linked.parent.eth", canonical: "linked.parent.eth" },

  // this name is incorrectly linked
  // { name: "wallet.linked.parent.eth", canonical: "wallet.linked.parent.eth" },

  // this name is correctly linked
  { name: "wallet.sub1.sub2.parent.eth", canonical: "wallet.sub1.sub2.parent.eth" },

  // NOTE: devnet says these are names but neither test.eth or alias.eth declare a subregistry
  // so their subnames aren't addressable
  // { name: "sub.alias.eth", canonical: "sub.alias.eth" },
  // { name: "sub.test.eth", canonical: "sub.alias.eth" },
] as const;

// ENSv2 names from the seed fixture — auto-included in generic devnet test lists below.
const SEEDED_ENSV2_NAMES = additionallyRegisteredNames
  .filter((entry) => entry.type === "ENSv2")
  .flatMap((entry) => [
    { name: entry.name, canonical: entry.name },
    ...("subnames" in entry ? entry.subnames : []).map((sub) => ({
      name: sub.name,
      canonical: sub.name,
    })),
  ]);

// ENSv1 names: registered in ENSv1 and reserved in the ENSv2 ETHRegistry (resolver = ENSV1Resolver),
// mirroring migration. Used for targeted ENSv1 tests and the reserved-entry walk tests.
export const DEVNET_ENSV1_NAMES = additionallyRegisteredNames
  .filter((entry) => entry.type === "ENSv1")
  .map((entry) => ({
    name: entry.name,
    label: entry.label,
    canonical: entry.name,
    wrapped: entry.wrapped,
  }));

export const DEVNET_NAMES = [...STATIC_DEVNET_NAMES, ...SEEDED_ENSV2_NAMES];

// labels that are direct children of 'eth'
export const DEVNET_ETH_LABELS = DEVNET_NAMES.map(({ name, canonical }) => {
  const isCanonical = name === canonical;
  if (!isCanonical) return null;
  if (!name.endsWith(".eth")) return null;

  const segments = name.split(".");

  // must be 2ld
  if (segments.length !== 2) return null;
  return segments[0];
}).filter((l): l is string => l !== null);
