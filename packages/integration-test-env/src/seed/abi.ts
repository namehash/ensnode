import { parseAbi } from "viem";

export const ethReverseRegistrarAbi = parseAbi([
  // https://github.com/ensdomains/contracts-v2/blob/42f2016e7ba87eb3854afe51ad55186a16b32a74/contracts/src/reverse-registrar/L2ReverseRegistrar.sol#L117-L119
  "function setName(string name) returns (bytes32)",
]);

// https://github.com/ensdomains/contracts-v2/blob/42f2016e7ba87eb3854afe51ad55186a16b32a74/contracts/test/utils/resolutions.ts#L28
export const publicResolverAbi = parseAbi([
  "function setName(bytes32 node, string newName)",
  "function setText(bytes32 node, string key, string value)",
  "function setAddr(bytes32 node, address a)",
  "function setAddr(bytes32 node, uint256 coinType, bytes a)",
  "function setContenthash(bytes32 node, bytes hash)",
  "function setPubkey(bytes32 node, bytes32 x, bytes32 y)",
  "function setABI(bytes32 node, uint256 contentType, bytes data)",
  "function setInterface(bytes32 node, bytes4 interfaceID, address implementer)",
  "function clearRecords(bytes32 node)",
]);

export const universalResolverV2Abi = parseAbi([
  "function findResolver(bytes name) view returns (address resolver, bytes32 node, uint256 offset)",
]);
