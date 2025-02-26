"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { replaceBigInts } from "@ponder/utils";
import { Check, CheckCircle2, Code2, Copy, RefreshCw } from "lucide-react";
import { PropsWithChildren, Suspense, useState } from "react";
import { useCodeSnippets } from "./hooks";
import { Provider as PonderClientProvider } from "./provider";

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      className={cn("h-8 w-8 p-0", copied && "text-green-500 hover:text-green-600")}
    >
      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">Copy code</span>
    </Button>
  );
}

export function PonderClientShell({ children }: PropsWithChildren) {
  return (
    <Suspense>
      <PonderClientProvider>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Ponder Client Examples</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore how to query ENS data using the Ponder Client
              </p>
            </div>
          </div>
          {children}
        </div>
      </PonderClientProvider>
    </Suspense>
  );
}

function QueryResult({
  data,
  isLoading,
  isRefetching,
  refetch,
  error,
}: {
  data: unknown;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
  error?: Error | null;
}) {
  return (
    <Card className="h-fit">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Query Result</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="hover:border-primary/50"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
          Run Query
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 rounded-lg bg-destructive/5 text-destructive text-sm">
            {error.message}
          </div>
        ) : (
          <div className="relative">
            {(isLoading || isRefetching) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <pre className="p-4 rounded-lg bg-muted font-mono text-xs overflow-auto max-h-[500px]">
              {JSON.stringify(
                replaceBigInts(data, (v) => String(v)),
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PonderClientContent() {
  const { ponderQuery, allSnippets, selectSnippet, selectedSnippetIndex, selectedSnippet } =
    useCodeSnippets();
  const { data, isLoading, isError, error, refetch, isRefetching } = ponderQuery;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          {allSnippets.map((snippet, idx) => (
            <Button
              key={snippet.code}
              variant={selectedSnippetIndex === idx ? "default" : "outline"}
              className={cn(
                "justify-start h-auto py-3 px-4",
                selectedSnippetIndex === idx
                  ? "bg-primary ring-2 ring-primary/20"
                  : "hover:bg-muted",
              )}
              onClick={() => selectSnippet(idx)}
            >
              <div className="flex items-center gap-2">
                {selectedSnippetIndex === idx ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <Code2 className="h-4 w-4 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium">{snippet.name}</div>
                  <div
                    className={cn(
                      "text-xs",
                      selectedSnippetIndex === idx
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {snippet.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Code Example</CardTitle>
            <CopyButton content={selectedSnippet.code} />
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-muted font-mono text-xs whitespace-pre overflow-x-auto">
              {selectedSnippet.code}
            </pre>
          </CardContent>
        </Card>
      </div>

      <QueryResult
        data={data}
        isLoading={isLoading}
        isRefetching={isRefetching}
        refetch={refetch}
        error={isError ? error : null}
      />
    </div>
  );
}
