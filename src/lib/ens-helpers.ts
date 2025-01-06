import { type Hex, concat, keccak256, namehash, toHex } from "viem";

class BaseName {
  private constructor(private readonly name: `.${string}eth`) {}

  static parse(name: string | undefined = "") {
    if (!name.startsWith(".")) throw new Error(`BASE NAME should start with '.'`);

    if (!name.endsWith(".eth")) throw new Error(`BASE NAME should end with '.eth'`);

    return new BaseName(name as `.${string}eth`);
  }

  toString() {
    return this.name;
  }
}

export const BASENAME = BaseName.parse(process.env.INDEX_BASENAME).toString();

// TODO: pull from ens utils lib or something
export const ROOT_NODE = namehash("");
export const BASENAME_NODE = namehash(BASENAME.slice(1));

// TODO: this should probably be a part of some ens util lib
export const makeSubnodeNamehash = (node: Hex, label: Hex) => keccak256(concat([node, label]));

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodeLabelhash.ts
export const encodeLabelhash = (hash: Hex): `[${string}]` => `[${hash.slice(2)}]`;

export const tokenIdToLabel = (tokenId: bigint) => toHex(tokenId, { size: 32 });

// https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68
const INVALID_CHARACTER_CODES_IN_LABEL = new Set([0, 46, 91, 93]);
export const isLabelValid = (name: string) => {
  if (!name) return false;

  for (let i = 0; i < name.length; i++) {
    if (INVALID_CHARACTER_CODES_IN_LABEL.has(name.charCodeAt(i))) return false;
  }

  return true;
};
