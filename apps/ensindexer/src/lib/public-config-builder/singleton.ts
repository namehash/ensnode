import { ensRainbowClient } from "@/lib/ensrainbow/singleton";
import { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

export const publicConfigBuilder = new PublicConfigBuilder(ensRainbowClient);
