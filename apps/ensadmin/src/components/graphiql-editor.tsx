"use client";

import "graphiql/graphiql.css";

import { GraphiQL } from "graphiql";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface GraphiQLEditorProps {
  /** The URL of the GraphQL endpoint */
  url?: string;

  /** Whether to use the AI query generator */
  aiQueryGeneratorEnabled: boolean;
}

export function GraphiQLEditor({ url, aiQueryGeneratorEnabled }: GraphiQLEditorProps) {
  if (!url || typeof window === "undefined") {
    return null;
  }

  const fetcher = createGraphiQLFetcher({
    url,
    // Disable subscriptions for now since we don't have a WebSocket server
    // legacyWsClient: false,
    subscriptionUrl: undefined,
    wsConnectionParams: undefined,
  });

  // Create a unique storage namespace for each endpoint
  const storageNamespace = `ensnode:graphiql:${url}`;

  // Custom storage implementation with namespaced keys
  const storage = {
    getItem: (key: string) => {
      return localStorage.getItem(`${storageNamespace}:${key}`);
    },
    setItem: (key: string, value: string) => {
      localStorage.setItem(`${storageNamespace}:${key}`, value);
    },
    removeItem: (key: string) => {
      localStorage.removeItem(`${storageNamespace}:${key}`);
    },
    clear: () => {
      localStorage.clear();
    },
    length: localStorage.length,
  };

  const [aiGeneratedQueryResult, setAiGeneratedQueryResult] = useState<AiQueryGeneratorResult>();

  const handleAiQueryResult = useCallback(
    (result: AiQueryGeneratorResult) => {
      setAiGeneratedQueryResult(result);
    },
    [setAiGeneratedQueryResult],
  );

  let query: string | undefined;
  let variables: string | undefined;

  if (aiQueryGeneratorEnabled && aiGeneratedQueryResult) {
    query = aiGeneratedQueryResult.query;
    variables = JSON.stringify(aiGeneratedQueryResult.variables, null, 2);
  }

  return (
    <section className="flex flex-col flex-1">
      {aiQueryGeneratorEnabled && <AiQueryGenerator onResult={handleAiQueryResult} url={url} />}

      <div className="flex-1 graphiql-container">
        <GraphiQL
          fetcher={fetcher}
          defaultEditorToolsVisibility={true}
          shouldPersistHeaders={true}
          storage={storage}
          forcedTheme="light"
          query={query}
          variables={variables}
        />
      </div>
    </section>
  );
}

interface AiQueryGeneratorResult {
  /** The query to execute */
  query: string;

  /** The variables to use for the query */
  variables: Record<string, unknown>;
}

interface AiQueryGeneratorProps {
  /** The callback to handle the result of the AI query generation */
  onResult: (result: AiQueryGeneratorResult) => void;

  /** The URL of the GraphQL endpoint */
  url: string;
}

function AiQueryGenerator({ onResult, url }: AiQueryGeneratorProps) {
  const createAiGeneratedQuery = useCallback(
    async (prompt: string) => {
      const requestUrl = new URL("/gql/api", window.location.origin);

      requestUrl.searchParams.set("prompt", prompt);
      requestUrl.searchParams.set("gqlApiUrl", url);

      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch AI generated query");
      }

      const responseJson = (await response.json()) as AiQueryGeneratorResult;

      if (!responseJson) {
        throw new Error("No data returned from AI generated query");
      }

      if (!responseJson.query || typeof responseJson.query !== "string") {
        throw new Error("No query returned from AI generated query");
      }

      if (!responseJson.variables) {
        throw new Error("No variables returned from AI generated query");
      }

      return {
        query: responseJson.query,
        variables: responseJson.variables,
      };
    },
    [url],
  );

  const aiQueryGeneratorMutation = useMutation({
    mutationFn: createAiGeneratedQuery,
    onSuccess: (data) => {
      onResult(data);
      console.log("AI generated suggested GraphQL query", data);
      toast.success("AI generated suggested GraphQL query");
    },
    onError: (error) => {
      console.error("Error generating GraphQL query with AI", error);
      toast.error("Error generating GraphQL query with AI");
    },
  });

  const promptInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const prompt = formData.get("prompt");

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    aiQueryGeneratorMutation.mutate(prompt.toString());
  };

  const handleSelectChange = (value: string) => {
    if (promptInputRef.current) {
      promptInputRef.current.value = value;
    }
  };

  const exampleQueries = [
    {
      label: "Get subnames",
      value: "Get the first 20 subnames of `makoto.eth` ordered by name ascending",
    },
    {
      label: "Get owned names",
      value:
        "Get the first 20 names owned by address `0xfFD1Ac3e8818AdCbe5C597ea076E8D3210B45df5` ordered by name ascending",
    },
  ];

  return (
    <form className="flex flex-col gap-2 p-4" onSubmit={handleSubmit}>
      <fieldset>
        <Select onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Example ENS AI Queries" />
          </SelectTrigger>
          <SelectContent>
            {exampleQueries.map((exampleQuery) => (
              <SelectItem key={exampleQuery.label} value={exampleQuery.value}>
                {exampleQuery.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="flex flex-col md:grid grid-cols-[auto_1fr_auto] gap-2 items-center">
        <Label htmlFor="prompt" className="w-auto">
          ENS AI Query Generator
        </Label>
        <Input
          type="text"
          required
          id="prompt"
          name="prompt"
          ref={promptInputRef}
          placeholder="Describe what you want to achieve with GraphQL..."
        />
        {aiQueryGeneratorMutation.isPending ? (
          <Button type="submit" disabled={true}>
            Generating...
          </Button>
        ) : (
          <Button type="submit">AI Generate Query</Button>
        )}
      </fieldset>
    </form>
  );
}
