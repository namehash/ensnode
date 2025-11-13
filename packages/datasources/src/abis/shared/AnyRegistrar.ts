import { mergeAbis } from "@ponder/utils";

import { BaseRegistrar as basenames_BaseRegistrar } from "../basenames/BaseRegistrar";
import { BaseRegistrar as lineanames_BaseRegistrar } from "../lineanames/BaseRegistrar";
import { BaseRegistrar as ethnames_BaseRegistrar } from "../root/BaseRegistrar";

export const AnyRegistrarABI = mergeAbis([
  ethnames_BaseRegistrar,
  basenames_BaseRegistrar,
  lineanames_BaseRegistrar,
]);
