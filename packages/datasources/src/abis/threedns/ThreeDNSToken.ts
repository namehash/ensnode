export const ThreeDNSToken = [
  {
    type: "event",
    name: "NewOwner",
    inputs: [
      { type: "bytes32", name: "node", indexed: true },
      { type: "bytes32", name: "label", indexed: true },
      { type: "address", name: "owner", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RegistrationCreated",
    inputs: [
      { type: "bytes32", name: "node", indexed: true },
      { type: "bytes32", name: "tld", indexed: true },
      { type: "bytes", name: "fqdn", indexed: false },
      { type: "address", name: "registrant", indexed: false },
      { type: "uint32", name: "controlBitmap", indexed: false },
      { type: "uint64", name: "expiry", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RegistrationExtended",
    inputs: [
      { type: "bytes32", name: "node", indexed: true },
      { type: "uint64", name: "duration", indexed: true },
      { type: "uint64", name: "newExpiry", indexed: true },
    ],
  },
  {
    type: "event",
    name: "RegistrationTransferred",
    inputs: [
      { type: "bytes32", name: "node", indexed: true },
      { type: "address", name: "newOwner", indexed: true },
      { type: "address", name: "operator", indexed: true },
    ],
  },
  {
    type: "event",
    name: "RegistrationBurned",
    inputs: [
      { type: "bytes32", name: "node", indexed: true },
      { type: "address", name: "burner", indexed: true },
    ],
  },
  {
    type: "function",
    name: "uri",
    inputs: [{ type: "uint256", name: "tokenId_" }],
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolver",
    inputs: [{ type: "bytes32", name: "node" }],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "node",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;
