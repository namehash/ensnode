import { EnsApiClient } from "@ensnode/ensnode-sdk";

export const client = new EnsApiClient({
  url: new URL(process.env.ENSNODE_URL || "http://localhost:4334"),
});
