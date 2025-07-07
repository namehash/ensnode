/**
 * This Hono application enables the ENSIndexer API to handle requests related to the Ethereum Follow Protocol.
 */

import { efp_listToken } from "ponder:schema";
import { Hono } from "hono";
import { type ReadonlyDrizzle, eq } from "ponder";
import { type ListTokenId, parseListTokenId } from "./utils";

interface HonoEFP {
  db: ReadonlyDrizzle<Record<string, unknown>>;
}

/**
 * Creates a Hono application with EFP routes.
 * @returns
 */
export function honoEFP({ db }: HonoEFP): Hono {
  const app = new Hono();

  // Route to handle EFP-related requests
  app.get("/list/:listTokenId", async function getListTokenById(ctx) {
    let listTokenId: ListTokenId;

    // Parse the listTokenId from the request parameter
    try {
      listTokenId = parseListTokenId(ctx.req.param("listTokenId"));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return ctx.json({ error: `Invalid list token ID. ${errorMessage}` }, 400);
    }

    // Fetch the EFP List Token from the database
    const listTokens = await db
      .select()
      .from(efp_listToken)
      .where(eq(efp_listToken.id, listTokenId));

    const listToken = listTokens[0];

    if (!listToken) {
      return ctx.json({ error: `List token with ID ${listTokenId} not found.` }, 404);
    }

    // Prepare the response DTO
    // Note: The DTO is a simplified version of the EFP List Token schema.
    const listTokenDto = {
      owner: listToken.owner,
      encodedLsl: listToken.lslId,
    };

    return ctx.json(listTokenDto, 200);
  });

  return app;
}
