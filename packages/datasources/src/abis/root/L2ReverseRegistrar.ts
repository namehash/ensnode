import type { Abi } from "viem";

export const L2ReverseRegistrar = [
  {
    type: "constructor",
    inputs: [
      {
        name: "chainId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "CHAIN_ID",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PARENT_NODE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "inceptionOf",
    inputs: [
      {
        name: "addr",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "inception",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [
      {
        name: "node",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nameForAddr",
    inputs: [
      {
        name: "addr",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      {
        name: "name_",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setName",
    inputs: [
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setNameForAddr",
    inputs: [
      {
        name: "addr",
        type: "address",
        internalType: "address",
      },
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setNameForAddrWithSignature",
    inputs: [
      {
        name: "claim",
        type: "tuple",
        internalType: "struct IL2ReverseRegistrar.NameClaim",
        components: [
          {
            name: "name",
            type: "string",
            internalType: "string",
          },
          {
            name: "addr",
            type: "address",
            internalType: "address",
          },
          {
            name: "chainIds",
            type: "uint256[]",
            internalType: "uint256[]",
          },
          {
            name: "signedAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setNameForOwnableWithSignature",
    inputs: [
      {
        name: "claim",
        type: "tuple",
        internalType: "struct IL2ReverseRegistrar.NameClaim",
        components: [
          {
            name: "name",
            type: "string",
            internalType: "string",
          },
          {
            name: "addr",
            type: "address",
            internalType: "address",
          },
          {
            name: "chainIds",
            type: "uint256[]",
            internalType: "uint256[]",
          },
          {
            name: "signedAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [
      {
        name: "interfaceID",
        type: "bytes4",
        internalType: "bytes4",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "syncName",
    inputs: [
      {
        name: "addr",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ExpiryUpdated",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "newExpiry",
        type: "uint64",
        indexed: true,
        internalType: "uint64",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LabelRegistered",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "labelHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "expiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LabelReserved",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "labelHash",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "expiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LabelUnregistered",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NameChanged",
    inputs: [
      {
        name: "node",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "name",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NameForAddrChanged",
    inputs: [
      {
        name: "addr",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "name",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ParentUpdated",
    inputs: [
      {
        name: "parent",
        type: "address",
        indexed: true,
        internalType: "contract IRegistry",
      },
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ResolverUpdated",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "resolver",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SubregistryUpdated",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "subregistry",
        type: "address",
        indexed: true,
        internalType: "contract IRegistry",
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "TokenRegenerated",
    inputs: [
      {
        name: "oldTokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "newTokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "ChainIdsNotAscending",
    inputs: [],
  },
  {
    type: "error",
    name: "CurrentChainNotFound",
    inputs: [
      {
        name: "chainId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: [],
  },
  {
    type: "error",
    name: "LabelIsEmpty",
    inputs: [],
  },
  {
    type: "error",
    name: "LabelIsTooLong",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "NotOwnerOfContract",
    inputs: [],
  },
  {
    type: "error",
    name: "SignatureNotValidYet",
    inputs: [
      {
        name: "signedAt",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentTime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "StaleSignature",
    inputs: [
      {
        name: "signedAt",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "inception",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "TimestampOutOfRange",
    inputs: [
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: [],
  },
  {
    type: "error",
    name: "UnreachableName",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "UnsupportedResolverProfile",
    inputs: [
      {
        name: "selector",
        type: "bytes4",
        internalType: "bytes4",
      },
    ],
  },
] as const satisfies Abi;
