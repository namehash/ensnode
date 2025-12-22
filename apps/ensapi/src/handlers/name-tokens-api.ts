import config from "@/config";

import { describeRoute, resolver as validationResolver } from "hono-openapi";
import { namehash } from "viem";
import z from "zod/v4";

import {
  ENS_ROOT,
  getParentNameFQDN,
  type NameTokensRequest,
  NameTokensResponseCodes,
  NameTokensResponseErrorCodes,
  type NameTokensResponseErrorNameTokensNotIndexed,
  type Node,
  type PluginName,
  serializeNameTokensResponse,
} from "@ensnode/ensnode-sdk";
import { makeNameTokensResponseSchema, makeNodeSchema } from "@ensnode/ensnode-sdk/internal";

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
  config.ensIndexerPublicConfig.plugins as PluginName[],
);

// Middleware managing access to Name Tokens API route.
// It makes the route available if all prerequisites are met,
// and if not returns the appropriate HTTP 503 (Service Unavailable) error.
app.use(nameTokensApiMiddleware);

/**
 * Request Query Schema
 *
 * Name Tokens API can be requested by either `name` or `domainId`, and
 * can never be requested by both, or neither.
 */
const nameTokensQuerySchema = z
  .object({
    domainId: makeNodeSchema("request.domainId").optional(),
    name: params.name.optional(),
  })
  .refine((data) => (data.domainId !== undefined) !== (data.name !== undefined), {
    message: "Exactly one of 'domainId' or 'name' must be provided",
  });

app.get(
  "/",
  describeRoute({
    summary: "Get Name Tokens",
    description: "Returns name tokens for requested identifier (domainId, or name)",
    responses: {
      200: {
        description: "Successfully retrieved name tokens",
        content: {
          "application/json": {
            schema: validationResolver(makeNameTokensResponseSchema("Name Tokens Response", true), {
              elo: 1,
            }),
          },
        },
      },
      404: {
        description: "Name tokens not indexed",
        content: {
          "application/json": {
            schema: validationResolver(makeNameTokensResponseSchema("Name Tokens Response", true), {
              elo: 2,
            }),
          },
        },
      },
      503: {
        description: "Service unavailable - indexing status not ready",
        content: {
          "application/json": {
            schema: validationResolver(makeNameTokensResponseSchema("Name Tokens Response", true), {
              elo: 3,
            }),
          },
        },
      },
    },
  }),
  validate("query", nameTokensQuerySchema),
  async (c) => {
    // Invariant: context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.IndexingStatusUnsupported,
          error: {
            message: "Name Tokens API is not available yet",
            details: "Indexing status middleware is required but not initialized.",
          },
        }),
        503,
      );
    }

    // Invariant: Indexing Status has been resolved successfully.
    if (c.var.indexingStatus instanceof Error) {
      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.IndexingStatusUnsupported,
          error: {
            message: "Name Tokens API is not available yet",
            details: "The indexing status must be available and resolved successfully.",
          },
        }),
        503,
      );
    }

    const request = c.req.valid("query") satisfies NameTokensRequest;
    let domainId: Node;

    if (request.name !== undefined) {
      const { name } = request;

      // return 404 when the requested name was the ENS Root
      if (name === ENS_ROOT) {
        return c.json(
          serializeNameTokensResponse({
            responseCode: NameTokensResponseCodes.Error,
            errorCode: NameTokensResponseErrorCodes.NameTokensNotIndexed,
            error: {
              message: "No indexed Name Tokens found",
              details: `The 'name' param must not be ENS Root, no tokens exist for it.`,
            },
          } satisfies NameTokensResponseErrorNameTokensNotIndexed),
          404,
        );
      }

      const parentNode = namehash(getParentNameFQDN(name));
      const subregistry = indexedSubregistries.find(
        (subregistry) => subregistry.node === parentNode,
      );

      // Return 404 response with error code for Name Tokens Not Indexed when
      // the parent name of the requested name was not registered in any of
      // the actively indexed subregistries.
      if (!subregistry) {
        logger.error(
          `This ENSNode instance has not been configured to index tokens for the requested name: '${name}'.`,
        );

        return c.json(
          serializeNameTokensResponse({
            responseCode: NameTokensResponseCodes.Error,
            errorCode: NameTokensResponseErrorCodes.NameTokensNotIndexed,
            error: {
              message: "No indexed Name Tokens found",
              details: `This ENSNode instance has not been configured to index tokens for the requested name: '${name}`,
            },
          } satisfies NameTokensResponseErrorNameTokensNotIndexed),
          404,
        );
      }

      domainId = namehash(name);
    } else if (request.domainId !== undefined) {
      domainId = request.domainId;
    } else {
      // This should never happen due to Zod validation, but TypeScript needs this
      throw new Error("Invariant(name-tokens-api): Either name or domainId must be provided");
    }

    const { omnichainSnapshot } = c.var.indexingStatus.snapshot;
    const accurateAsOf = omnichainSnapshot.omnichainIndexingCursor;

    const registeredNameTokens = await findRegisteredNameTokensForDomain(domainId, accurateAsOf);

    // Return 404 response with error code for Name Tokens Not Indexed when
    // the no name tokens were found for the domain ID associated with
    // the requested name.
    if (!registeredNameTokens) {
      const errorMessageSubject =
        request.name !== undefined ? `name: '${request.name}'` : `domain ID: '${request.domainId}'`;

      logger.error(
        `This ENSNode instance has never indexed tokens for the requested ${errorMessageSubject}.`,
      );

      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.NameTokensNotIndexed,
          error: {
            message: "No indexed Name Tokens found",
            details: `No Name Tokens were indexed by this ENSNode instance for the requested ${errorMessageSubject}.`,
          },
        } satisfies NameTokensResponseErrorNameTokensNotIndexed),
        404,
      );
    }

    return c.json(
      serializeNameTokensResponse({
        responseCode: NameTokensResponseCodes.Ok,
        registeredNameTokens,
      }),
    );
  },
);

export default app;
