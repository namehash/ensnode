export default [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    inputs: [
      { internalType: "address", name: "addr", type: "address" },
      { internalType: "bytes4", name: "selector", type: "bytes4" },
    ],
    name: "LibDiamondCut_facetAlreadyExists",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "addr", type: "address" },
      { internalType: "bytes4", name: "selector", type: "bytes4" },
    ],
    name: "LibDiamondCut_facetDoesNotExist",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "addr", type: "address" },
      { internalType: "bytes4", name: "selector", type: "bytes4" },
    ],
    name: "LibDiamondCut_immutableFunction",
    type: "error",
  },
  {
    inputs: [],
    name: "ThreeDNSAccessControlled_invalidAuthority",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "ThreeDNSAccessControlled_unauthorized",
    type: "error",
  },
  { inputs: [], name: "ThreeDNSRegControl_accessDenied", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IThreeDNSAuthority",
        name: "previousAuthority",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IThreeDNSAuthority",
        name: "newAuthority",
        type: "address",
      },
    ],
    name: "AuthorityChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  { stateMutability: "payable", type: "fallback" },
  {
    inputs: [],
    name: "authority",
    outputs: [
      {
        internalType: "contract IThreeDNSAuthority",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IThreeDNSAuthority",
        name: "_newAuthority",
        type: "address",
      },
    ],
    name: "changeAuthority",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "facetAddress", type: "address" },
          {
            internalType: "enum IDiamondCut.FacetCutAction",
            name: "action",
            type: "uint8",
          },
          {
            internalType: "bytes4[]",
            name: "functionSelectors",
            type: "bytes4[]",
          },
        ],
        internalType: "struct IDiamondCut.FacetCut[]",
        name: "_diamondCut",
        type: "tuple[]",
      },
      { internalType: "address", name: "_init", type: "address" },
      { internalType: "bytes", name: "_calldata", type: "bytes" },
    ],
    name: "diamondCut",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IThreeDNSAuthority",
        name: "_authority",
        type: "address",
      },
      { internalType: "address", name: "resolver_", type: "address" },
      { internalType: "string", name: "domainName_", type: "string" },
      { internalType: "string", name: "domainVersion_", type: "string" },
      { internalType: "uint64", name: "chainId_", type: "uint64" },
      {
        internalType: "contract IERC20Upgradeable",
        name: "usdc_",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId_", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes4", name: "interfaceId_", type: "bytes4" },
      { internalType: "bool", name: "enabled_", type: "bool" },
    ],
    name: "trackInterface",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
] as const;
