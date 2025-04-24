import Anthropic, { type ClientOptions } from "@anthropic-ai/sdk";
import { Adapter, type AdapterResponse } from "@gqlpt/adapter-base";
import { GQLPTClient } from "gqlpt";
import { type NextRequest } from "next/server";

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
const TEMPERATURE = 0.1;

/** The system prompt to use for the LLM */
const SYSTEM_PROMPT = `
You are a helpful assistant that generates GraphQL queries and variables.

You will be given a prompt and a GraphQL schema.

You will generate a GraphQL query and variables that will be used to test the GraphQL API.

Always respond with the GraphQL query and variables in JSON format.

Always include an operation name for each generated GraphQL query. Do not forget about it under any circumstances.

Include useful comments in the generated GraphQL query to make it easier to understand.
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
        systemPrompt: SYSTEM_PROMPT,
        maxTokensPerMessage: MAX_TOKENS_PER_MESSAGE,
        temperature: TEMPERATURE,
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

interface AdapterAnthropicOptions extends ClientOptions {
  /** The Anthropic model to use */
  model: Model;

  /** The system prompt to use */
  systemPrompt: string;

  /** The max tokens to use per message */
  maxTokensPerMessage: number;
}

enum Model {
  Claude35Sonnet = "claude-3-5-sonnet-20241022",
  Claude37Sonnet = "claude-3-7-sonnet-20250219",
}

/**
 * Adapter for Anthropic with selectable model and system prompt.
 *
 * Based on https://github.com/rocket-connect/gqlpt/blob/18af9c9/packages/adapter-anthropic/src/index.ts
 */
class AdapterAnthropic extends Adapter {
  /** Anthropic client */
  private anthropic: Anthropic;

  /** The Anthropic model to use */
  private model: Model;

  /** The system prompt to use */
  private systemPrompt: string;

  /** The max tokens to use per message */
  private maxTokensPerMessage: number;

  private messageHistory: Map<string, Array<Anthropic.MessageParam>> = new Map();

  constructor(options: AdapterAnthropicOptions) {
    super();
    this.anthropic = new Anthropic(options);
    this.model = options.model;
    this.systemPrompt = options.systemPrompt;
    this.maxTokensPerMessage = options.maxTokensPerMessage;
  }

  /**
   * Connect to Anthropic
   *
   * Based on https://github.com/rocket-connect/gqlpt/blob/18af9c9/packages/adapter-anthropic/src/index.ts#L18-L30
   */
  async connect() {
    const response = await this.anthropic.messages.create({
      system:
        "You are to test the connection to the Anthropic API. Respond with 'Pong' when you see 'Ping'.",
      messages: [{ role: "user", content: "Ping" }],
      model: this.model,
      max_tokens: this.maxTokensPerMessage,
    });

    if ((response.content[0] as any).text !== "Pong") {
      throw new Error("Cannot connect to Anthropic");
    }
  }

  /**
   * Send a text message to Anthropic
   *
   * Based on https://github.com/rocket-connect/gqlpt/blob/18af9c9/packages/adapter-anthropic/src/index.ts#L32-L61
   */
  async sendText(text: string, conversationId?: string): Promise<AdapterResponse> {
    let messages: Array<Anthropic.MessageParam> = [{ role: "user", content: text }];

    if (conversationId && this.messageHistory.has(conversationId)) {
      messages = [...this.messageHistory.get(conversationId)!, ...messages];
    }

    console.log("Sending messages to Anthropic", messages);

    const response = await this.anthropic.messages.create({
      // add system prompt if it was provided
      system: this.systemPrompt,
      messages,
      // use the selected model
      model: this.model,
      // set a default max tokens
      max_tokens: 1024,
    });

    const content = (response.content[0] as any).text;
    const newId = response.id;

    this.messageHistory.set(newId, [
      ...(conversationId ? this.messageHistory.get(conversationId) || [] : []),
      { role: "user" as const, content: text },
      { role: "assistant" as const, content },
    ]);

    return {
      content,
      conversationId: newId,
    };
  }
}
