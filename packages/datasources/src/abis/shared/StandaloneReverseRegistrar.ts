export const StandaloneReverseRegistrar = [
  {
    type: "event",
    name: "NameForAddrChanged",
    inputs: [
      { indexed: true, internalType: "address", name: "addr", type: "address" },
      { indexed: false, internalType: "string", name: "name", type: "string" },
    ],
  },
] as const;
