import { AdapterAnthropic } from "@gqlpt/adapter-anthropic";
import { GQLPTClient } from "gqlpt";
import { type NextRequest } from "next/server";
import { ensSubgraphSchemaGql } from "./ens-subgraph-gql-schema";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const maybePrompt = requestUrl.searchParams.get("prompt");
  const maybeGqlApiUrl = requestUrl.searchParams.get("gqlApiUrl");

  let generateQueryDto: GenerateQueryDto;

  // try to parse the request into a DTO
  try {
    generateQueryDto = getQueryGeneratorClient.parseRequest({
      maybePrompt,
      maybeGqlApiUrl,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Parsing request error: ${errorMessage}` }, { status: 400 });
  }

  let queryGeneratorClient: QueryGeneratorClient;

  // try to get the query generator client
  try {
    // get the optional LLM API key from the environment variable
    const llmApiKey = process.env.ANTHROPIC_API_KEY;

    if (!llmApiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required but has not been set.");
    }

    // get the query generator client for the given GQL API URL
    queryGeneratorClient = await getQueryGeneratorClient({
      ...generateQueryDto,
      llmApiKey,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`Query generator client error: ${errorMessage}`);
    return Response.json({ error: `Query generator client error` }, { status: 500 });
  }

  // try to generate the query and variables
  try {
    const generatedQueryAndVariables = await queryGeneratorClient.generateQueryAndVariables(
      generateQueryDto.prompt,
    );
    return Response.json(generatedQueryAndVariables);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Query generation error: ${errorMessage}`);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

/** The max tokens to use per message */
const MAX_TOKENS_PER_MESSAGE = 1024;

/** The LLM temperature */
const TEMPERATURE = 0;

/** The system prompt to use for the LLM */
const SYSTEM_PROMPT = `
You are a helpful assistant that generates GraphQL queries and variables.

You will be given a prompt and a GraphQL schema.

You will generate a GraphQL query and variables that will be used to test the GraphQL API.

Always respond with the GraphQL query and variables in JSON format.

Always include an operation name for each generated GraphQL query. Do not forget about it under any circumstances.

Include useful comments in the generated GraphQL query to make it easier to understand.

Values such as 'vitalik.eth' or 'abc.123.com' should be interpreted as domain names.

Hex values with 40 hex digits (20 bytes) such as '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' should be interpreted as addresses or account id values. All addresses and account id values in your output should be formatted completely in lowercase.

Hex values with 64 hex digits (32 bytes) such as '0x412329d38ad88cb88b1bb6d4005cd6aa010b7bdeb55fd28f980943d423725fb1' should be interpreted as either a labelhash, or the id of a domain. All labelhash and domain id values in your output should be formatted completely in lowercase.

If requested to generate a query that finds domains by name, unless specifically requested to use a particular strategy such as "names ending with", default to finding name values that are an exact match.
`;

/**
 * Map of GQL API URLs to query generator clients.
 */
const clients = new Map<string, GQLPTClient>();

interface QueryGeneratorClient extends Pick<GQLPTClient, "generateQueryAndVariables"> {}

interface GetQueryGeneratorClientOptions {
  /** The URL of the GQL API used for GQL schema introspection */
  gqlApiUrl: URL;

  /** The API key for the LLM */
  llmApiKey?: string;
}

/**
 * Get a query generator client for the given GQL API URL.
 *
 * @param gqlApiUrl The URL of the GQL API
 * @param llmApiKey The API key for the LLM
 * @returns query generator client
 */
async function getQueryGeneratorClient(
  options: GetQueryGeneratorClientOptions,
): Promise<QueryGeneratorClient> {
  let client = clients.get(options.gqlApiUrl.toString());

  if (!client) {
    // create the client if it doesn't exist yet
    client = new GQLPTClient({
      url: options.gqlApiUrl.toString(),
      adapter: new AdapterAnthropic({
        apiKey: options.llmApiKey,
        model: Model.Claude35Sonnet,
        systemPrompt: `${SYSTEM_PROMPT}\n\n${ensSubgraphSchemaGql}`,
        maxTokensPerMessage: MAX_TOKENS_PER_MESSAGE,
        temperature: TEMPERATURE,
        cacheControl: {
          type: "ephemeral",
        },
      }),
    });

    try {
      // ensure the client is connected
      await client.connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to connect to the LLM: ${errorMessage}`);
    }

    // store the client in the map for future use
    clients.set(options.gqlApiUrl.toString(), client);
  }

  return client;
}

interface ParseRequestOptions {
  maybeGqlApiUrl: string | null;
  maybePrompt: string | null;
}

/**
 * Parse the request URL to get the prompt and GQL API URL.
 *
 * @param requestUrl The request URL
 * @returns The prompt and GQL API URL
 * @throws {Error} If the prompt or GQL API URL was not provided
 */
getQueryGeneratorClient.parseRequest = function parseQueryGeneratorClientRequest(
  options: ParseRequestOptions,
): GenerateQueryDto {
  return GenerateQueryDto.tryParse(options.maybePrompt, options.maybeGqlApiUrl);
};

/**
 * DTO for the generateQueryAndVariables request.
 */
class GenerateQueryDto {
  private constructor(
    public readonly prompt: string,
    public readonly gqlApiUrl: URL,
  ) {}

  static tryParse(maybePrompt: string | null, maybeGqlApiUrl: string | null) {
    const prompt = GenerateQueryDto.parsePrompt(maybePrompt);
    const gqlApiUrl = GenerateQueryDto.parseGqlApiUrl(maybeGqlApiUrl);

    return new GenerateQueryDto(prompt, gqlApiUrl);
  }

  static parsePrompt(maybePrompt: string | null) {
    if (!maybePrompt) {
      throw new Error("Prompt is required");
    }

    return maybePrompt;
  }

  static parseGqlApiUrl(maybeGqlApiUrl: string | null) {
    if (!maybeGqlApiUrl) {
      throw new Error("URL is required");
    }

    try {
      return new URL(maybeGqlApiUrl);
    } catch (error) {
      throw new Error("Invalid URL");
    }
  }
}

enum Model {
  Claude35Sonnet = "claude-3-5-sonnet-20241022",
  Claude37Sonnet = "claude-3-7-sonnet-20250219",
}
