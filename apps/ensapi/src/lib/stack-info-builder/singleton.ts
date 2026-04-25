import ensApiConfig from "@/config";

import { ensDbClient } from "@/lib/ensdb/singleton";
import { lazyProxy } from "@/lib/lazy";
import { StackInfoBuilder } from "@/lib/stack-info-builder/stack-info-builder";

export const stackInfoBuilder = lazyProxy<StackInfoBuilder>(() => {
  return new StackInfoBuilder(ensApiConfig, ensDbClient);
});
