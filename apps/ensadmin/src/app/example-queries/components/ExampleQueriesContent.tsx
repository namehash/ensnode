"use client";

import { useExampleQueries } from "@/app/example-queries/hooks";
import { GraphQLIcon } from "@/components/icons/GraphQLIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

interface ExampleQueriesContentProps {
  ensNodeInstanceURL: string | URL;
}

export function ExampleQueriesContent({ ensNodeInstanceURL }: ExampleQueriesContentProps) {
  const { selectedExampleQueryIndex, allExampleQueries, selectExampleQuery, selectedExampleQuery } =
    useExampleQueries();

  return (
    <>
      <div className="h-fit flex flex-row flex-wrap gap-4">
        {allExampleQueries.map((exampleQuery, idx) => (
          <Button
            key={`ExampleQuery${exampleQuery.id}`}
            variant={selectedExampleQueryIndex === idx ? "default" : "outline"}
            className={cn(
              "justify-start gap-2 h-fit box-border py-2 pl-2 pr-3 max-w-[456px]",
              selectedExampleQueryIndex === idx
                ? "bg-primary ring-2 ring-primary/20"
                : "hover:bg-muted",
            )}
            onClick={() => selectExampleQuery(idx)}
          >
            <exampleQuery.icon style={{ width: "20px", height: "auto" }} />
            <div className="text-left min-w-[275px]">
              <h1 className="font-medium">{exampleQuery.name}</h1>
              <p className={cn("text-xs", "text-muted-foreground")}>
                {exampleQuery.shortDescription}
              </p>
            </div>
          </Button>
        ))}
      </div>
      <Card className="w-full">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Query Code</CardTitle>
          {/*TODO: for now it is a very rudimentary test of how things could work - will surely be polished dropped later*/}
          <Button asChild>
            <Link
              href={{
                pathname: "/example-queries/example-editor",
                query: {
                  ensnode: `${ensNodeInstanceURL}`,
                  query: `${selectedExampleQuery.query}`,
                  variables: `${selectedExampleQuery.variables}`,
                },
              }}
              target="_self"
            >
              Open in GraphiQL editor <GraphQLIcon style={{ width: "20px", height: "auto" }} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row flex-nowrap justify-between items-start gap-6">
          <pre className="p-4 rounded-lg bg-muted font-mono text-xs whitespace-pre overflow-x-auto overflow-y-auto h-[190px] w-full lg:w-2/3">
            {selectedExampleQuery.query}
          </pre>
          <div className="w-full lg:w-1/3">
            <h2 className="text-xl font-semibold mb-1">What does it do?</h2>
            <p className="text-sm overflow-y-auto">{selectedExampleQuery.longDescription}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
