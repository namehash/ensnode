import { CodeBlock } from "@/components/code-block";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraceRenderer } from "@/components/tracing/renderer";
import { renderMicroseconds } from "@/lib/time";
import { getTraceDuration } from "@/lib/tracing";
import { cn } from "@/lib/utils";
import {
  AcceleratableResponse,
  ClientError,
  ProtocolTrace,
  TraceableResponse,
} from "@ensnode/ensnode-sdk";
import { UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type QueryResult<K extends string> = UseQueryResult<
  { [key in K]: unknown } & AcceleratableResponse & TraceableResponse
>;

const renderTraceDuration = (trace: ProtocolTrace) => renderMicroseconds(getTraceDuration(trace));

const MULTIPLE_THRESHOLD = 1.3; // accelerated requests must be 1.3x faster to be considered green

export function RenderRequestsOutput<KEY extends string>({
  dataKey,
  accelerated,
  unaccelerated,
}: {
  dataKey: KEY;
  accelerated: QueryResult<KEY>;
  unaccelerated: QueryResult<KEY>;
}) {
  const [tab, setTab] = useState("accelerated");

  // TODO: produce a diff between accelerated/not-accelerated and display any differences
  const result = useMemo(() => {
    if (tab === "accelerated" && accelerated.status === "success") {
      return accelerated.data[dataKey];
    }

    if (tab === "unaccelerated" && unaccelerated.status === "success") {
      return unaccelerated.data[dataKey];
    }

    return accelerated.data?.[dataKey] || unaccelerated.data?.[dataKey];
  }, [accelerated, unaccelerated, tab]);

  const someError = accelerated.error || unaccelerated.error;

  // show major loading if either query is pending/refreshing
  const showLoading =
    (accelerated.isPending || accelerated.isRefetching) &&
    (unaccelerated.isPending || unaccelerated.isRefetching);

  const multipleDiff = useMemo(() => {
    if (accelerated.status !== "success") return null;
    if (unaccelerated.status !== "success") return null;

    if (!accelerated.data.trace) return null;
    if (!unaccelerated.data.trace) return null;

    const acceleratedDuration = getTraceDuration(accelerated.data.trace);
    const unacceleratedDuration = getTraceDuration(unaccelerated.data.trace);

    if (acceleratedDuration === 0) return null;

    const multiple = unacceleratedDuration / acceleratedDuration;
    return multiple;
  }, [accelerated, unaccelerated]);

  if (showLoading) {
    // if we're loading but there's no active fetch, the query is unable to be executed, so render null
    if (accelerated.fetchStatus === "idle") return null;

    // otherwise, we're in-flight, render loading
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ENSNode Response</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-scroll">
          {(() => {
            if (someError) {
              return (
                <CodeBlock className="rounded-lg text-xs">
                  {JSON.stringify(
                    {
                      message: someError.message,
                      ...(someError instanceof ClientError &&
                        !!someError.details && { details: someError.details }),
                    },
                    null,
                    2,
                  )}
                </CodeBlock>
              );
            }

            return (
              <CodeBlock className="rounded-lg text-xs">
                {JSON.stringify(result, null, 2)}
              </CodeBlock>
            );
          })()}
        </CardContent>
      </Card>
      {!someError && (accelerated.data?.trace || unaccelerated.data?.trace) && (
        <Tabs value={tab} onValueChange={setTab}>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex flex-row items-center justify-between gap-4">
                <span>Execution Trace</span>
                {(() => {
                  // if accelerated request was not actually accelerated, notify the user
                  if (accelerated.data && !accelerated.data.accelerationAttempted) {
                    return (
                      <span className="bg-muted py-1 px-2 rounded-lg text-sm text-muted-foreground">
                        ENSNode did not attempt to accelerate this request.
                      </span>
                    );
                  }

                  // it was accelerated, show diff
                  if (multipleDiff) {
                    return (
                      <span
                        className={cn(
                          "bg-muted py-1 px-2 rounded-lg text-sm",
                          multipleDiff > MULTIPLE_THRESHOLD
                            ? "text-green-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {multipleDiff > MULTIPLE_THRESHOLD
                          ? `Acclerated request was ${multipleDiff.toFixed(2)}x faster.`
                          : "Timings are more or less equivalent."}
                      </span>
                    );
                  }

                  return null;
                })()}
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
    </>
  );
}
