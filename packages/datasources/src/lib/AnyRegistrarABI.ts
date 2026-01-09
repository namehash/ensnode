import { mergeAbis } from "@ponder/utils";

import { BaseRegistrar as basenames_BaseRegistrar } from "../abis/basenames/BaseRegistrar";
import { BaseRegistrar as lineanames_BaseRegistrar } from "../abis/lineanames/BaseRegistrar";
import { BaseRegistrar as ethnames_BaseRegistrar } from "../abis/root/BaseRegistrar";

export const AnyRegistrarABI = mergeAbis([
  ethnames_BaseRegistrar,
  basenames_BaseRegistrar,
  lineanames_BaseRegistrar,
]);
