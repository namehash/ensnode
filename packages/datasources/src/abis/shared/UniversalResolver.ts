import { mergeAbis } from "@ponder/utils";

import { IMulticallable } from "./IMulticallable";
import { IUniversalResolver } from "./IUniversalResolver";

export const UniversalResolverABI = mergeAbis([IUniversalResolver, IMulticallable]);
