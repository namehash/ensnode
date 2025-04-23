import { AdapterAnthropic } from "@gqlpt/adapter-anthropic";
import { GQLPTClient } from "gqlpt";
import { type NextRequest } from "next/server";

const clients = new Map<string, GQLPTClient>();
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const prompt = requestUrl.searchParams.get("prompt");
  const gqlApiUrl = requestUrl.searchParams.get("gqlApiUrl");

  if (!gqlApiUrl) {
    return Response.json({ error: "gqlApiUrl is required" }, { status: 400 });
  }

  try {
    new URL(gqlApiUrl);
  } catch (error) {
    return Response.json({ error: "Invalid gqlApiUrl" }, { status: 400 });
  }

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  let gqlptClient = clients.get(gqlApiUrl);

  if (!gqlptClient) {
    gqlptClient = new GQLPTClient({
      url: gqlApiUrl,
      adapter: new AdapterAnthropic({
        apiKey: anthropicApiKey,
      }),
    });

    await gqlptClient.connect();

    clients.set(gqlApiUrl, gqlptClient);
  }

  const result = await gqlptClient.generateQueryAndVariables(prompt);

  return Response.json({ result, gqlApiUrl, prompt });
}
