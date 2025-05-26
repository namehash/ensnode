import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { eq } from "ponder";

import { resolveReverse } from "@/api/lib/reverse-resolution";
import { makeResolverId } from "@/lib/ids";
import { DatasourceName, ENSDeployments } from "@ensnode/ens-deployments";
import { Hono } from "hono";
import { namehash } from "viem";

const app = new Hono();

const JESSE_ADDRESS = "0xFb434f97aB5Def37277505833992F2a8E065e14D";

app.get("/records", async (ctx) => {
  // TODO: zod validation for args
  // const data = await resolveReverse("0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1");
  const {
    chain,
    contracts: { Resolver },
  } = ENSDeployments.sepolia[DatasourceName.ReverseResolverBase];
  // TODO: use const addrReverseLabel = (address: Address): Label => ;
  const reverseNode = namehash(`${JESSE_ADDRESS.slice(2).toLowerCase()}.addr.reverse`);

  const resolverId = makeResolverId(chain.id, Resolver.address, reverseNode);

  const resolver = await db
    .select()
    .from(schema.resolver)
    .where(eq(schema.resolver.id, resolverId));
  console.log(resolver);
  return ctx.json({ resolver });
});

export default app;
