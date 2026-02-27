export const DEVNET_NAMES = [
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
  { name: "wallet.linked.parent.eth", canonical: "wallet.linked.parent.eth" },

  // this name is actually correctly aliased
  { name: "wallet.sub1.sub2.parent.eth", canonical: "wallet.linked.parent.eth" },

  // NOTE: devnet says these are names but neither test.eth or alias.eth declare a subregistry
  // so their subnames aren't resolvable
  // { name: "sub.alias.eth", canonical: "sub.alias.eth" },
  // { name: "sub.test.eth", canonical: "sub.alias.eth" },
];

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
