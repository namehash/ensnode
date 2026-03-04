import { ensDbClient } from "@/lib/ensdb-client/singleton";
import { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

export const publicConfigBuilder = new PublicConfigBuilder(ensDbClient);
