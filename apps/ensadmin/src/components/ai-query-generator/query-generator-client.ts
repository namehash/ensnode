import { GQLPTClient } from "gqlpt";
import { AdapterAnthropic, Model } from "./anthropic-adapter";

const SYSTEM_PROMPT = `
You are a helpful assistant that generates GraphQL queries and variables.

You will be given a prompt and a GQL API URL.

You will generate a GraphQL query and variables that will be used to test the GQL API.

Always respond with the GraphQL query and variables in JSON format.

Always include operation name for each generated GraphQL query. Do not forget about it under any circumstances.

Include useful comments in the generated GraphQL query to make it easier to understand.
`;

/**
 * Map of GQL API URLs to query generator clients.
 */
const clients = new Map<string, GQLPTClient>();

export interface QueryGeneratorClient extends Pick<GQLPTClient, "generateQueryAndVariables"> {}

export interface GetQueryGeneratorClientOptions {
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
export async function getQueryGeneratorClient(
  options: GetQueryGeneratorClientOptions,
): Promise<QueryGeneratorClient> {
  let client = clients.get(options.gqlApiUrl.toString());

  if (!client) {
    // create the client if it doesn't exist yet
    client = new GQLPTClient({
      url: options.gqlApiUrl.toString(),
      adapter: new AdapterAnthropic({
        apiKey: options.llmApiKey,
        model: Model.Claude37Sonnet,
        systemPrompt: SYSTEM_PROMPT,
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
export class GenerateQueryDto {
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
