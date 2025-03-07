export const RegistryDatastore = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "registry",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "resolver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    name: "ResolverUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "registry",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "subregistry",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    name: "SubregistryUpdate",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registry",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
    ],
    name: "getResolver",
    outputs: [
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
    ],
    name: "getResolver",
    outputs: [
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
    ],
    name: "getSubregistry",
    outputs: [
      {
        internalType: "address",
        name: "subregistry",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "registry",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
    ],
    name: "getSubregistry",
    outputs: [
      {
        internalType: "address",
        name: "subregistry",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    name: "setResolver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "labelHash",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "subregistry",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "flags",
        type: "uint96",
      },
    ],
    name: "setSubregistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
