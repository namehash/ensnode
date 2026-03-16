import { mergeAbis } from "@ponder/utils";

import { UniversalResolverV2 } from "../ensv2/UniversalResolverV2";
import { UniversalResolverV1 } from "../root/UniversalResolverV1";

export const UniversalResolverABI = mergeAbis([UniversalResolverV1, UniversalResolverV2]);
