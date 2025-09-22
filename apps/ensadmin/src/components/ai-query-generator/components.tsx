import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import type { AiQueryGeneratorResult } from "./types";

interface QueryPromptExample {
  /** The label of the example query */
  label: string;

  /** The value (prompt) of the example query */
  value: string;
}

const exampleQueries = [
  {
    label: "Get subnames",
    value: "Get the first 20 subnames of `ens.eth` ordered by name ascending",
  },
  {
    label: "Get owned names",
    value:
      "Get the first 20 names owned by address `0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5` ordered by name ascending",
  },
] satisfies Array<QueryPromptExample>;

export interface AiQueryGeneratorProps {
  /** The callback to handle the result of the AI query generation */
  onResult: (result: AiQueryGeneratorResult) => void;

  /** The URL of the GraphQL endpoint */
  url: string;
}

/**
 * A form for generating GraphQL queries using AI.
 *
 * @param onResult - The callback to handle the result of the AI query generation.
 * @param url - The URL of the GraphQL endpoint.
 */
export function AiQueryGeneratorForm({ onResult, url }: AiQueryGeneratorProps) {
  const createAiGeneratedQuery = useCallback(
    async (prompt: string) => {
      const requestUrl = new URL("/api/ai", window.location.origin);

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

      toast.success("AI generated suggested GraphQL query");
    },
    onError: (error) => {
      console.error("Error generating GraphQL query with AI", error);
      toast.error("Error generating GraphQL query with AI");
    },
  });

  const promptInputRef = useRef<HTMLInputElement>(null);

  /**
   * The handler for the form submission.
   * */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const prompt = formData.get("prompt");

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    aiQueryGeneratorMutation.mutate(prompt.toString());
  };

  /**
   * The handler for the example query selection change.
   * */
  const handleSelectChange = (value: string) => {
    if (promptInputRef.current) {
      promptInputRef.current.value = value;
    }
  };

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
