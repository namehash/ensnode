import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  type AcceleratableResponse,
  ClientError,
  type TraceableResponse,
  type TracingTrace,
} from "@ensnode/ensnode-sdk";

import { CodeBlock } from "@/components/code-block";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TraceRenderer } from "@/components/tracing/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderMicroseconds } from "@/lib/time";
import { getTraceDuration } from "@/lib/tracing";
import { cn } from "@/lib/utils";

type QueryResult<K extends string> = UseQueryResult<
  { [key in K]: unknown } & AcceleratableResponse & TraceableResponse
>;

const renderTraceDuration = (trace: TracingTrace) => renderMicroseconds(getTraceDuration(trace));

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

  const focused = useMemo(() => {
    if (tab === "accelerated") return accelerated;
    if (tab === "unaccelerated") return unaccelerated;

    throw new Error("never");
  }, [accelerated, unaccelerated, tab]);

  // need special derivation to capture refetching state
  const acceleratedLoading = accelerated.isPending || accelerated.isRefetching;
  const unacceleratedLoading = unaccelerated.isPending || unaccelerated.isRefetching;

  const acceleratedSuccess = !acceleratedLoading && !accelerated.isError;
  const unacceleratedSuccess = !unacceleratedLoading && !unaccelerated.isError;

  const multipleDiff = useMemo(() => {
    if (!acceleratedSuccess) return null;
    if (!unacceleratedSuccess) return null;

    if (!accelerated.data.trace) return null;
    if (!unaccelerated.data.trace) return null;

    const acceleratedDuration = getTraceDuration(accelerated.data.trace);
    const unacceleratedDuration = getTraceDuration(unaccelerated.data.trace);

    if (acceleratedDuration === 0) return null; // prevent division by zero...

    return unacceleratedDuration / acceleratedDuration;
  }, [accelerated, unaccelerated]);

  useEffect(() => {
    if (unacceleratedLoading) setTab("accelerated");
  }, [unacceleratedLoading, setTab]);

  // if we're loading but there's no active fetch, the query is unable to be executed, so render null
  const isNotExecutable = acceleratedLoading && accelerated.fetchStatus === "idle";
  if (isNotExecutable) return null;

  // show major loading if accelerated query is pending/refreshing
  if (acceleratedLoading) {
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
      {/* Response Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ENSNode Response</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-scroll">
          {(() => {
            if (focused.error) {
              return (
                <CodeBlock className="rounded-lg text-xs">
                  {JSON.stringify(
                    {
                      message: focused.error.message,
                      ...(focused.error instanceof ClientError &&
                        !!focused.error.details && { details: focused.error.details }),
                    },
                    null,
                    2,
                  )}
                </CodeBlock>
              );
            }

            return (
              <CodeBlock className="rounded-lg text-xs">
                {JSON.stringify(focused.data?.[dataKey], null, 2)}
              </CodeBlock>
            );
          })()}
        </CardContent>
      </Card>

      {/* Execution Trace Card */}
      {acceleratedSuccess && (
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
                  <TabsTrigger value="accelerated" className="flex flex-row gap-2 cursor-pointer">
                    <span>Accelerated</span>
                    {acceleratedSuccess && accelerated.data.trace ? (
                      `(${renderTraceDuration(accelerated.data.trace)})`
                    ) : (
                      <LoadingSpinner className="h-4 w-4" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="unaccelerated"
                    className="flex flex-row gap-2 cursor-pointer"
                    disabled={unacceleratedLoading}
                  >
                    <span>Unaccelerated</span>
                    {unacceleratedSuccess && unaccelerated.data.trace ? (
                      `(${renderTraceDuration(unaccelerated.data.trace)})`
                    ) : (
                      <LoadingSpinner className="h-4 w-4" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TabsContent value="accelerated">
                {acceleratedSuccess && !!accelerated.data.trace && (
                  <TraceRenderer trace={accelerated.data.trace} />
                )}
              </TabsContent>
              <TabsContent value="unaccelerated">
                {unacceleratedSuccess && !!unaccelerated.data.trace && (
                  <TraceRenderer trace={unaccelerated.data.trace} />
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
    </>
  );
}
