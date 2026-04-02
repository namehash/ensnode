import type { Abi } from "viem";

export const ETHRegistrar = [
  {
    type: "constructor",
    inputs: [
      {
        name: "registry",
        type: "address",
        internalType: "contract IPermissionedRegistry",
      },
      {
        name: "hcaFactory",
        type: "address",
        internalType: "contract IHCAFactoryBasic",
      },
      {
        name: "beneficiary",
        type: "address",
        internalType: "address",
      },
      {
        name: "minCommitmentAge",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "maxCommitmentAge",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "minRegisterDuration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "rentPriceOracle_",
        type: "address",
        internalType: "contract IRentPriceOracle",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "BENEFICIARY",
    inputs: [],
    outputs: [
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
    name: "MAX_COMMITMENT_AGE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_COMMITMENT_AGE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_REGISTER_DURATION",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "REGISTRY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IPermissionedRegistry",
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
    name: "commit",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "commitmentAt",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "commitTime",
        type: "uint64",
        internalType: "uint64",
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
    name: "isAvailable",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
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
    name: "isPaymentToken",
    inputs: [
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
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
    name: "isValid",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
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
    name: "makeCommitment",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "secret",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "subregistry",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "referrer",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "register",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "secret",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "subregistry",
        type: "address",
        internalType: "contract IRegistry",
      },
      {
        name: "resolver",
        type: "address",
        internalType: "address",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
      },
      {
        name: "referrer",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renew",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
      },
      {
        name: "referrer",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rentPrice",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    outputs: [
      {
        name: "base",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "premium",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rentPriceOracle",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IRentPriceOracle",
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
    name: "setRentPriceOracle",
    inputs: [
      {
        name: "oracle",
        type: "address",
        internalType: "contract IRentPriceOracle",
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
    name: "CommitmentMade",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
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
    type: "event",
    name: "NameRegistered",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
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
        name: "subregistry",
        type: "address",
        indexed: false,
        internalType: "contract IRegistry",
      },
      {
        name: "resolver",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "duration",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        indexed: false,
        internalType: "contract IERC20",
      },
      {
        name: "referrer",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "base",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "premium",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "NameRenewed",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "duration",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "newExpiry",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "paymentToken",
        type: "address",
        indexed: false,
        internalType: "contract IERC20",
      },
      {
        name: "referrer",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "base",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentTokenAdded",
    inputs: [
      {
        name: "paymentToken",
        type: "address",
        indexed: true,
        internalType: "contract IERC20",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentTokenRemoved",
    inputs: [
      {
        name: "paymentToken",
        type: "address",
        indexed: true,
        internalType: "contract IERC20",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RentPriceOracleChanged",
    inputs: [
      {
        name: "oracle",
        type: "address",
        indexed: false,
        internalType: "contract IRentPriceOracle",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "CommitmentTooNew",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "validFrom",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "blockTimestamp",
        type: "uint64",
        internalType: "uint64",
      },
    ],
  },
  {
    type: "error",
    name: "CommitmentTooOld",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "validTo",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "blockTimestamp",
        type: "uint64",
        internalType: "uint64",
      },
    ],
  },
  {
    type: "error",
    name: "DurationTooShort",
    inputs: [
      {
        name: "duration",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "minDuration",
        type: "uint64",
        internalType: "uint64",
      },
    ],
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
  {
    type: "error",
    name: "InvalidOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "MaxCommitmentAgeTooLow",
    inputs: [],
  },
  {
    type: "error",
    name: "NameIsAvailable",
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
    name: "NameNotAvailable",
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
    name: "NotValid",
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
    name: "PaymentTokenNotSupported",
    inputs: [
      {
        name: "paymentToken",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpiredCommitmentExists",
    inputs: [
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
] as const satisfies Abi;
