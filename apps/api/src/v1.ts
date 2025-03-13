import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import { replaceBigInts } from "@ponder/utils";
import { Hono } from "hono";
import { namehash } from "viem";

import { getDomainAndPath } from "./lib/get-domain.js";

const app = new Hono();

/**
 * Finds a Domain by its `name` in the nametree.
 */
app.get("/domain/:name", async (c) => {
  const nameParam = c.req.param("name");

  // fetches a domain by name and the concrete path in the nametree
  const { domain, path } = await getDomainAndPath(nameParam);

  // identify any unknown labels in the name
  const unknownSegments = path.filter((segment) => segment.label === undefined);

  // TODO: attempt heal with ENSRainbow batch
  const knownOrEncodedSegments = (await Promise.all(unknownSegments)).reduce<
    Record<string, string>
  >((memo, segment) => {
    memo[segment.token_id] === encodeLabelhash(uint256ToHex32(BigInt(segment.token_id)));
    return memo;
  }, {});

  // construct the domain's name to the best of our abilities
  const name = path
    // reverse to name-order
    .toReversed()
    // return known label or ens rainbow result
    .map((segment) => segment.label ?? knownOrEncodedSegments[segment.token_id])
    // join into name
    .join(".");

  const node = namehash(name);

  // TODO: type this when we're more confident in what we want
  const result = {
    domain: {
      ...domain,
      // add constructed name and node to domain response
      name,
      node,
    },
    path,
  };

  return c.json(replaceBigInts(result, (v) => String(v)));
});

export default app;
