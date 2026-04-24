import { parseAbi } from "viem";

export const ethReverseRegistrarAbi = parseAbi([
  // https://github.com/ensdomains/contracts-v2/blob/42f2016e7ba87eb3854afe51ad55186a16b32a74/contracts/src/reverse-registrar/L2ReverseRegistrar.sol#L117-L119
  "function setName(string name) returns (bytes32)",
]);
