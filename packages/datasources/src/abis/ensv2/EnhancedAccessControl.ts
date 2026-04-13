import type { Abi } from "viem";

export const EnhancedAccessControl = [
  {
    type: "function",
    name: "HCA_FACTORY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IHCAFactoryBasic",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ROOT_RESOURCE",
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
    name: "getAssigneeCount",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "counts",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "mask",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "grantRoles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "grantRootRoles",
    inputs: [
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasAssignees",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
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
    name: "hasRoles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
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
    name: "hasRootRoles",
    inputs: [
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
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
    name: "revokeRoles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeRootRoles",
    inputs: [
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "roleCount",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
    ],
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
    name: "roles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
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
    type: "event",
    name: "EACRolesChanged",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "oldRoleBitmap",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "newRoleBitmap",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "EACCannotGrantRoles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EACCannotRevokeRoles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EACInvalidAccount",
    inputs: [],
  },
  {
    type: "error",
    name: "EACInvalidRoleBitmap",
    inputs: [
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "EACMaxAssignees",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "role",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "EACMinAssignees",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "role",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "EACRootResourceNotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "EACUnauthorizedAccountRoles",
    inputs: [
      {
        name: "resource",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "roleBitmap",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
] as const satisfies Abi;
