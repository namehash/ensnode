import { CodeBlock } from "@/components/code-block";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TraceRenderer } from "@/components/tracing/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderTraceDuration } from "@/lib/tracing";
import { ProtocolTrace } from "@ensnode/ensnode-sdk";
import { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

type QueryResult<K extends string> = UseQueryResult<
  { [key in K]: unknown } & { trace?: ProtocolTrace }
>;

export function RenderRequestsOutput<KEY extends string>({
  dataKey,
  accelerated,
  unaccelerated,
}: {
  dataKey: KEY;
  accelerated: QueryResult<KEY>;
  unaccelerated: QueryResult<KEY>;
}) {
  // TODO: render a % faster in green/red for comparison
  // TODO: produce a diff between accelerated/not-accelerated and display any differences
  const result = useMemo(() => {
    return accelerated.data?.[dataKey] || unaccelerated.data?.[dataKey];
  }, [accelerated]);

  const someError = accelerated.error || unaccelerated.error;

  // show major loading if either query is pending/refreshing
  const showLoading =
    (accelerated.isPending || accelerated.isRefetching) &&
    (unaccelerated.isPending || unaccelerated.isRefetching);

  if (showLoading) {
    return (
      <Card className="w-full">
        <CardContent className="h-96">
          <div className="h-full w-full flex flex-col justify-center items-center p-8">
            <LoadingSpinner className="h-16 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {(accelerated.data?.trace || unaccelerated.data?.trace) && (
        <Tabs defaultValue="accelerated">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex flex-row items-center justify-between gap-4">
                <span>Protocol Tracing</span>
                <TabsList>
                  <TabsTrigger value="accelerated" className="flex flex-row gap-2">
                    <span>Accelerated</span>
                    {accelerated.data ? (
                      `(${renderTraceDuration(accelerated.data.trace!)})`
                    ) : (
                      <LoadingSpinner className="h-4 w-4" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="unaccelerated" className="flex flex-row gap-2">
                    <span>Unaccelerated</span>
                    {unaccelerated.data ? (
                      `(${renderTraceDuration(unaccelerated.data.trace!)})`
                    ) : (
                      <LoadingSpinner className="h-4 w-4" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TabsContent value="accelerated">
                {(() => {
                  switch (accelerated.status) {
                    case "pending": {
                      return (
                        <div className="h-64 w-full flex flex-col justify-center items-center p-8">
                          <LoadingSpinner className="h-16 w-16" />
                        </div>
                      );
                    }
                    case "error": {
                      return (
                        <div className="h-64 w-full flex flex-col justify-center items-center p-8">
                          <span className="text-muted-foreground">{accelerated.error.message}</span>
                        </div>
                      );
                    }
                    case "success": {
                      if (accelerated.data.trace)
                        return <TraceRenderer trace={accelerated.data.trace} />;
                      throw new Error(
                        "Invariant: RenderRequestsOutput accelerated.data.trace is undefined.",
                      );
                    }
                  }
                })()}
              </TabsContent>
              <TabsContent value="unaccelerated">
                {(() => {
                  switch (unaccelerated.status) {
                    case "pending": {
                      return (
                        <div className="h-64 w-full flex flex-col justify-center items-center p-8">
                          <LoadingSpinner className="h-16 w-16" />
                        </div>
                      );
                    }
                    case "error": {
                      return (
                        <div className="h-64 w-full flex flex-col justify-center items-center p-8">
                          <span className="text-muted-foreground">
                            {unaccelerated.error.message}
                          </span>
                        </div>
                      );
                    }
                    case "success": {
                      if (unaccelerated.data.trace)
                        return <TraceRenderer trace={unaccelerated.data.trace} />;
                      throw new Error(
                        "Invariant: RenderRequestsOutput unaccelerated.data.trace is undefined.",
                      );
                    }
                  }
                })()}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ENSNode Response</CardTitle>
        </CardHeader>
        <CardContent className="h-96 overflow-scroll">
          {(() => {
            if (someError) {
              return (
                <div className="h-64 w-full flex flex-col justify-center items-center p-8">
                  <span className="text-muted-foreground">{someError.message}</span>
                </div>
              );
            }
            if (result) {
              return <CodeBlock>{JSON.stringify(result, null, 2)}</CodeBlock>;
            }
            throw new Error("idk shouldnt happen");
          })()}
        </CardContent>
      </Card>
    </>
  );
}
