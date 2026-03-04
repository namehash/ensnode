import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import { PublicConfigBuilder } from "@/lib/public-config-builder/public-config-builder";

const ensRainbowClient = getENSRainbowApiClient();

export const publicConfigBuilder = new PublicConfigBuilder(ensRainbowClient);
