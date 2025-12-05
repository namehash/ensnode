import config from "@/config";

import { namehash } from "viem";
import z from "zod/v4";

import {
  getLatestIndexedBlockRef,
  getParentNameFQDN,
  NameTokensOrders,
  NameTokensResponseCodes,
  NameTokensResponseErrorCodes,
  type NameTokensResponseErrorUnknownNameContext,
  nameTokensFilter,
  serializeNameTokensResponse,
} from "@ensnode/ensnode-sdk";
import { makePositiveIntegerSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { findNameTokens } from "@/lib/name-tokens/find-name-tokens";
import { getIndexedSubregistries } from "@/lib/name-tokens/get-indexed-subregistries";
import { nameTokensApiMiddleware } from "@/middleware/name-tokens.middleware";

const app = factory.createApp();

const logger = makeLogger("name-tokens-api");

const RESPONSE_RECORDS_PER_PAGE_DEFAULT = 25;
const RESPONSE_RECORDS_PER_PAGE_MAX = 25;

const indexedSubregistries = getIndexedSubregistries(config.namespace);

// Middleware managing access to Name Tokens API routes.
// It makes the routes available if all prerequisites are met.
app.use(nameTokensApiMiddleware);

app.get(
  "/:name",
  validate(
    "param",
    z.object({
      name: params.name,
    }),
  ),

  validate(
    "query",
    z.object({
      orderBy: z.enum(NameTokensOrders).default(NameTokensOrders.LatestNameTokens),

      recordsPerPage: params.queryParam
        .optional()
        .default(RESPONSE_RECORDS_PER_PAGE_DEFAULT)
        .pipe(z.coerce.number())
        .pipe(makePositiveIntegerSchema().max(RESPONSE_RECORDS_PER_PAGE_MAX)),
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

    const { name } = c.req.valid("param");

    const parentNode = namehash(getParentNameFQDN(name));
    const subregistry = indexedSubregistries.find((subregistry) => subregistry.node === parentNode);

    if (!subregistry) {
      logger.error(`The requested '${name}' name is unknown to ENSNode.`);

      return c.json(
        serializeNameTokensResponse({
          responseCode: NameTokensResponseCodes.Error,
          errorCode: NameTokensResponseErrorCodes.UnknownNameContext,
          error: {
            message: "Internal Server Error",
            details: `The requested '${name}' name is unknown to ENSNode.`,
          },
        } satisfies NameTokensResponseErrorUnknownNameContext),
      );
    }

    const { snapshot } = c.var.indexingStatus.value;
    const { subregistryId } = subregistry;
    const latestIndexedBlockRef = getLatestIndexedBlockRef(snapshot, subregistryId.chainId);

    // Invariant: Latest Indexed Block ref must be available for a known `subregistryId.chainId`.
    if (latestIndexedBlockRef === null) {
      throw new Error(
        `Invariant(name-tokens-api): Latest Indexed Block ref must be available for a known 'subregistryId.chainId'`,
      );
    }

    const { orderBy, recordsPerPage } = c.req.valid("query");
    const accurateAsOf = latestIndexedBlockRef.timestamp;

    const nameTokens = await findNameTokens({
      filters: [nameTokensFilter.byDomainId(namehash(name))],
      accurateAsOf,
      orderBy,
      limit: recordsPerPage,
    });

    return c.json(
      serializeNameTokensResponse({
        responseCode: NameTokensResponseCodes.Ok,
        nameTokens,
        accurateAsOf,
      }),
    );
  },
);

export default app;
