import config from "@/config";
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

export const client = new ENSNodeClient({ url: new URL(config.ensindexerUrl) });
