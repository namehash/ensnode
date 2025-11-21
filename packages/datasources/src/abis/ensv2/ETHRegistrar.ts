export const ETHRegistrar = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "commitment",
        "type": "bytes32"
      },
      {
        "internalType": "uint64",
        "name": "validFrom",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "blockTimestamp",
        "type": "uint64"
      }
    ],
    "name": "CommitmentTooNew",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "commitment",
        "type": "bytes32"
      },
      {
        "internalType": "uint64",
        "name": "validTo",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "blockTimestamp",
        "type": "uint64"
      }
    ],
    "name": "CommitmentTooOld",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "minDuration",
        "type": "uint64"
      }
    ],
    "name": "DurationTooShort",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MaxCommitmentAgeTooLow",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "NameAlreadyRegistered",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "NameNotRegistered",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "NotValid",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      }
    ],
    "name": "PaymentTokenNotSupported",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "commitment",
        "type": "bytes32"
      }
    ],
    "name": "UnexpiredCommitmentExists",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "commitment",
        "type": "bytes32"
      }
    ],
    "name": "CommitmentMade",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "contract IRegistry",
        "name": "subregistry",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "resolver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "referrer",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "base",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "premium",
        "type": "uint256"
      }
    ],
    "name": "NameRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "newExpiry",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "referrer",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "base",
        "type": "uint256"
      }
    ],
    "name": "NameRenewed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      }
    ],
    "name": "PaymentTokenAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      }
    ],
    "name": "PaymentTokenRemoved",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "commitment",
        "type": "bytes32"
      }
    ],
    "name": "commit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "commitment",
        "type": "bytes32"
      }
    ],
    "name": "commitmentAt",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "isAvailable",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      }
    ],
    "name": "isPaymentToken",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "isValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "secret",
        "type": "bytes32"
      },
      {
        "internalType": "contract IRegistry",
        "name": "subregistry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "resolver",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "referrer",
        "type": "bytes32"
      }
    ],
    "name": "makeCommitment",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "secret",
        "type": "bytes32"
      },
      {
        "internalType": "contract IRegistry",
        "name": "subregistry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "resolver",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "referrer",
        "type": "bytes32"
      }
    ],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "referrer",
        "type": "bytes32"
      }
    ],
    "name": "renew",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "contract IERC20",
        "name": "paymentToken",
        "type": "address"
      }
    ],
    "name": "rentPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "base",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "premium",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
