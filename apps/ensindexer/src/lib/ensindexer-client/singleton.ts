import config from "@/config";

import { EnsIndexerClient } from "@ensnode/ensnode-sdk";

export const ensIndexerClient = new EnsIndexerClient({ url: config.ensIndexerUrl });
