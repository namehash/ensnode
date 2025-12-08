import config from "@/config";

import { namehash } from "viem";
import z from "zod/v4";

import {
  getParentNameFQDN,
  NameTokensResponseCodes,
  NameTokensResponseErrorCodes,
  type NameTokensResponseErrorUnknownNameContext,
  serializeNameTokensResponse,
} from "@ensnode/ensnode-sdk";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { findRegisteredNameTokensForDomain } from "@/lib/name-tokens/find-name-tokens-for-domain";
import { getIndexedSubregistries } from "@/lib/name-tokens/get-indexed-subregistries";
import { nameTokensApiMiddleware } from "@/middleware/name-tokens.middleware";

const app = factory.createApp();

const logger = makeLogger("name-tokens-api");

const indexedSubregistries = getIndexedSubregistries(
  config.namespace,
  config.ensIndexerPublicConfig.plugins,
);

// Middleware managing access to Name Tokens API route.
// It makes the route available if all prerequisites are met,
// and if not returns the appropriate HTTP 503 (Service Unavailable) error.
app.use(nameTokensApiMiddleware);

app.get(
  "/",
  validate(
    "query",
    z.object({
      name: params.name,
    }),
  ),
  async (c) => {
    // Invariant: context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(name-tokens-api): indexingStatusMiddleware required`);
    }

    // Invariant: Indexing Status has been resolved successfully.
    if (c.var.indexingStatus.isRejected) {
      throw new Error(
        `Invariant(name-tokens-api): Indexing Status has to be resolved successfully`,
      );
    }

    const { name } = c.req.valid("query");
    const parentNode = namehash(getParentNameFQDN(name));
    const subregistry = indexedSubregistries.find((subregistry) => subregistry.node === parentNode);

    // Return 404 response with error code for unknown name context when
    // the parent name of the requested name was not registered in any of
    // the actively indexed subregistries.
    if (!subregistry) {
      logger.error(
        `This ENSNode instance has not been configured to index tokens for the requested name: '${name}'.`,
      );

      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.UnknownNameContext,
          error: {
            message: "Internal Server Error",
            details: `The requested '${name}' name is unknown to ENSNode.`,
          },
        } satisfies NameTokensResponseErrorUnknownNameContext),
        404,
      );
    }

    const { omnichainSnapshot } = c.var.indexingStatus.value.snapshot;

    const domainId = namehash(name);
    const registeredNameTokens = await findRegisteredNameTokensForDomain(domainId);

    // Return 404 response with error code for unknown name context when
    // the no name tokens were found for the domain ID associated with
    // the requested name.
    if (!registeredNameTokens) {
      logger.error(
        `This ENSNode instance has never indexed tokens for the requested name: '${name}'.`,
      );

      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.UnknownNameContext,
          error: {
            message: "Internal Server Error",
            details: `The requested '${name}' name is unknown to ENSNode.`,
          },
        } satisfies NameTokensResponseErrorUnknownNameContext),
        404,
      );
    }

    const accurateAsOf = omnichainSnapshot.omnichainIndexingCursor;

    return c.json(
      serializeNameTokensResponse({
        responseCode: NameTokensResponseCodes.Ok,
        registeredNameTokens,
        accurateAsOf,
      }),
    );
  },
);

export default app;
