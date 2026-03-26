import { ensRainbowPublicConfigCache } from "@/cache/ensrainbow-public-config";
import { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

export const publicConfigBuilder = new PublicConfigBuilder(ensRainbowPublicConfigCache);
