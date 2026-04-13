import type { Abi } from "viem";

export const UniversalResolverV2 = [
  {
    type: "constructor",
    inputs: [
      {
        name: "root",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "batchGatewayProvider",
        type: "address",
        internalType: "contract IGatewayProvider",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "ROOT_REGISTRY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "batchGatewayProvider",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IGatewayProvider",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ccipBatch",
    inputs: [
      {
        name: "batch",
        type: "tuple",
        internalType: "struct CCIPBatcher.Batch",
        components: [
          {
            name: "lookups",
            type: "tuple[]",
            internalType: "struct CCIPBatcher.Lookup[]",
            components: [
              {
                name: "target",
                type: "address",
                internalType: "address",
              },
              {
                name: "call",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "data",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "flags",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "gateways",
            type: "string[]",
            internalType: "string[]",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct CCIPBatcher.Batch",
        components: [
          {
            name: "lookups",
            type: "tuple[]",
            internalType: "struct CCIPBatcher.Lookup[]",
            components: [
              {
                name: "target",
                type: "address",
                internalType: "address",
              },
              {
                name: "call",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "data",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "flags",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "gateways",
            type: "string[]",
            internalType: "string[]",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ccipBatchCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "batch",
        type: "tuple",
        internalType: "struct CCIPBatcher.Batch",
        components: [
          {
            name: "lookups",
            type: "tuple[]",
            internalType: "struct CCIPBatcher.Lookup[]",
            components: [
              {
                name: "target",
                type: "address",
                internalType: "address",
              },
              {
                name: "call",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "data",
                type: "bytes",
                internalType: "bytes",
              },
              {
                name: "flags",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
          {
            name: "gateways",
            type: "string[]",
            internalType: "string[]",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ccipReadCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "findCanonicalName",
    inputs: [
      {
        name: "registry",
        type: "address",
        internalType: "contract IRegistry",
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
    name: "findCanonicalRegistry",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "findExactRegistry",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "findRegistries",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "contract IRegistry[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "findResolver",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "node",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "offset",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requireResolver",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "info",
        type: "tuple",
        internalType: "struct AbstractUniversalResolver.ResolverInfo",
        components: [
          {
            name: "name",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "offset",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "node",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "resolver",
            type: "address",
            internalType: "address",
          },
          {
            name: "extended",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      {
        name: "name",
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
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolveBatchCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolveCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
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
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "resolveDirectCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolveDirectCallbackError",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "resolveWithGateways",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "gateways",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolveWithResolver",
    inputs: [
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "gateways",
        type: "string[]",
        internalType: "string[]",
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
    name: "reverse",
    inputs: [
      {
        name: "lookupAddress",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "coinType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reverseAddressCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "primary",
        type: "string",
        internalType: "string",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "reverseResolver",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "reverseNameCallback",
    inputs: [
      {
        name: "response",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "primary",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reverseWithGateways",
    inputs: [
      {
        name: "lookupAddress",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "coinType",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "gateways",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    outputs: [
      {
        name: "primary",
        type: "string",
        internalType: "string",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "reverseResolver",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [
      {
        name: "interfaceId",
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
    type: "error",
    name: "DNSDecodingFailed",
    inputs: [
      {
        name: "dns",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "DNSEncodingFailed",
    inputs: [
      {
        name: "ens",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "HttpError",
    inputs: [
      {
        name: "status",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "message",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidBatchGatewayResponse",
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
    name: "OffchainLookup",
    inputs: [
      {
        name: "sender",
        type: "address",
        internalType: "address",
      },
      {
        name: "urls",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "callData",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "callbackFunction",
        type: "bytes4",
        internalType: "bytes4",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "OffsetOutOfBoundsError",
    inputs: [
      {
        name: "offset",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "length",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ResolverError",
    inputs: [
      {
        name: "errorData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "ResolverNotContract",
    inputs: [
      {
        name: "name",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ResolverNotFound",
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
    name: "ReverseAddressMismatch",
    inputs: [
      {
        name: "primary",
        type: "string",
        internalType: "string",
      },
      {
        name: "primaryAddress",
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
