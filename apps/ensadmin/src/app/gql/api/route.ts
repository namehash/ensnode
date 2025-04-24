import {
  type GenerateQueryDto,
  type QueryGeneratorClient,
  getQueryGeneratorClient,
} from "@ensnode/utils";
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
    const generatedQuery = await queryGeneratorClient.generateQueryAndVariables(
      generateQueryDto.prompt,
    );
    return Response.json({ generateQueryDto, generatedQuery });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Query generation error: ${errorMessage}`);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
